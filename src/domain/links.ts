import { byPosition } from "./scope";
import type { Book, Chapter, LinkKind, Scene, Workspace } from "./types";

/** A scene together with where it sits, for displaying cross-book references. */
export interface SceneAppearance {
  scene: Scene;
  chapter: Chapter;
  book: Book;
}

/** The id list on a scene that holds references of the given kind. */
export function linkIdsOf(scene: Scene, kind: LinkKind): string[] {
  return kind === "character" ? scene.characterIds : scene.locationIds;
}

/**
 * All scenes (across every book) that reference the entity, ordered by book
 * title and reading order. Scenes whose chapter or book is missing are skipped.
 */
export function appearancesOf(ws: Workspace, kind: LinkKind, entityId: string): SceneAppearance[] {
  const chapters = new Map(ws.chapters.map((c) => [c.id, c]));
  const books = new Map(ws.books.map((b) => [b.id, b]));
  const result: SceneAppearance[] = [];
  for (const scene of ws.scenes) {
    if (!linkIdsOf(scene, kind).includes(entityId)) continue;
    const chapter = chapters.get(scene.chapterId);
    const book = chapter && books.get(chapter.bookId);
    if (chapter && book) result.push({ scene, chapter, book });
  }
  return result.sort(
    (a, b) =>
      a.book.title.localeCompare(b.book.title, "de") ||
      byPosition(a.chapter, b.chapter) ||
      byPosition(a.scene, b.scene),
  );
}

/**
 * Entities of `otherKind` that share at least one scene with the given entity,
 * e.g. the locations a character visits or the characters it meets.
 *
 * @returns Map from the other entity's id to the number of shared scenes.
 */
export function coOccurrences(
  ws: Workspace,
  kind: LinkKind,
  entityId: string,
  otherKind: LinkKind,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const scene of ws.scenes) {
    if (!linkIdsOf(scene, kind).includes(entityId)) continue;
    for (const otherId of linkIdsOf(scene, otherKind)) {
      if (kind === otherKind && otherId === entityId) continue;
      counts.set(otherId, (counts.get(otherId) ?? 0) + 1);
    }
  }
  return counts;
}

/** Returns a copy of the scene with the reference added or removed. */
export function toggleLink(scene: Scene, kind: LinkKind, entityId: string): Scene {
  const ids = linkIdsOf(scene, kind);
  const next = ids.includes(entityId) ? ids.filter((id) => id !== entityId) : [...ids, entityId];
  return kind === "character" ? { ...scene, characterIds: next } : { ...scene, locationIds: next };
}

/**
 * Removes every reference to the entity from the scenes.
 *
 * @returns Only the scenes that actually changed.
 */
export function unlinkEverywhere(scenes: readonly Scene[], kind: LinkKind, entityId: string): Scene[] {
  return scenes.filter((s) => linkIdsOf(s, kind).includes(entityId)).map((s) => toggleLink(s, kind, entityId));
}
