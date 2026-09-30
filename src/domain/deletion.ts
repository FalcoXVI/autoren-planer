import { unlinkEverywhere } from "./links";
import type { CollectionName, LinkKind, OwnerRef, Scene, Workspace } from "./types";

/** An entity the user wants to delete. */
export interface DeletionTarget {
  collection: CollectionName;
  id: string;
}

/** Everything that has to change to delete a target without leaving dangling references. */
export interface DeletionPlan {
  /** Ids to soft-delete, per collection. */
  remove: Record<CollectionName, string[]>;
  /** Scenes that stay but lose references to removed characters or locations. */
  sceneUpdates: Scene[];
}

/** Thrown when a deletion would orphan data the user still needs. */
export class DeletionBlockedError extends Error {}

/**
 * Computes the cascade for deleting an entity:
 * - scene: only the scene
 * - chapter: the chapter and its scenes
 * - character / location: the entity, and its references are removed from all scenes
 * - book: the book with its chapters, scenes and book-owned characters/locations
 * - series: the series and its shared characters/locations; blocked while books belong to it
 *
 * @throws DeletionBlockedError if a series still contains books.
 */
export function planDeletion(ws: Workspace, target: DeletionTarget): DeletionPlan {
  const plan: DeletionPlan = {
    remove: { series: [], books: [], chapters: [], scenes: [], characters: [], locations: [] },
    sceneUpdates: [],
  };
  const { id } = target;

  switch (target.collection) {
    case "scenes":
      plan.remove.scenes.push(id);
      break;
    case "chapters":
      plan.remove.chapters.push(id);
      plan.remove.scenes.push(...ws.scenes.filter((s) => s.chapterId === id).map((s) => s.id));
      break;
    case "characters":
    case "locations":
      plan.remove[target.collection].push(id);
      break;
    case "books":
      plan.remove.books.push(id);
      plan.remove.chapters.push(...ws.chapters.filter((c) => c.bookId === id).map((c) => c.id));
      plan.remove.scenes.push(...ws.scenes.filter((s) => s.bookId === id).map((s) => s.id));
      addOwnedEntities(ws, { kind: "book", id }, plan);
      break;
    case "series":
      if (ws.books.some((b) => b.seriesId === id)) {
        throw new DeletionBlockedError("Series still contains books");
      }
      plan.remove.series.push(id);
      addOwnedEntities(ws, { kind: "series", id }, plan);
      break;
  }

  plan.sceneUpdates = unlinkRemovedEntities(ws.scenes, plan);
  return plan;
}

function addOwnedEntities(ws: Workspace, owner: OwnerRef, plan: DeletionPlan): void {
  const owned = (e: { owner: OwnerRef }) => e.owner.kind === owner.kind && e.owner.id === owner.id;
  plan.remove.characters.push(...ws.characters.filter(owned).map((c) => c.id));
  plan.remove.locations.push(...ws.locations.filter(owned).map((l) => l.id));
}

/** Strips references to removed characters/locations from scenes that survive the deletion. */
function unlinkRemovedEntities(scenes: readonly Scene[], plan: DeletionPlan): Scene[] {
  const removedScenes = new Set(plan.remove.scenes);
  const updated = new Map<string, Scene>();
  const unlink = (kind: LinkKind, ids: string[]) => {
    for (const entityId of ids) {
      const current = scenes.filter((s) => !removedScenes.has(s.id)).map((s) => updated.get(s.id) ?? s);
      for (const scene of unlinkEverywhere(current, kind, entityId)) updated.set(scene.id, scene);
    }
  };
  unlink("character", plan.remove.characters);
  unlink("location", plan.remove.locations);
  return [...updated.values()];
}
