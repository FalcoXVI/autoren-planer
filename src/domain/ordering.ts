import { byPosition } from "./scope";
import type { Chapter, Scene } from "./types";

/**
 * Moves an element within a list to a new index; the index is clamped to the
 * list bounds. Returns a new array.
 */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const result = [...items];
  const [item] = result.splice(from, 1);
  if (item === undefined) return result;
  result.splice(clamp(to, 0, result.length), 0, item);
  return result;
}

/**
 * Reorders a chapter within its book.
 *
 * @param chapters All chapters of one book.
 * @returns The chapters whose position changed.
 */
export function reorderChapter(chapters: readonly Chapter[], chapterId: string, toIndex: number): Chapter[] {
  const ordered = [...chapters].sort(byPosition);
  const from = ordered.findIndex((c) => c.id === chapterId);
  if (from < 0) throw new Error(`Unknown chapter ${chapterId}`);
  return renumber(moveItem(ordered, from, toIndex));
}

/**
 * Moves a scene to `toIndex` inside `toChapterId`, which may be its current
 * chapter or another one of the same book. Both affected chapters are
 * renumbered so positions stay gap-free.
 *
 * @param scenes All scenes of the book.
 * @returns The scenes whose chapter or position changed.
 */
export function moveScene(
  scenes: readonly Scene[],
  sceneId: string,
  toChapterId: string,
  toIndex: number,
): Scene[] {
  const scene = scenes.find((s) => s.id === sceneId);
  if (!scene) throw new Error(`Unknown scene ${sceneId}`);

  const othersIn = (chapterId: string) =>
    scenes.filter((s) => s.chapterId === chapterId && s.id !== sceneId).sort(byPosition);

  const target = othersIn(toChapterId);
  target.splice(clamp(toIndex, 0, target.length), 0, { ...scene, chapterId: toChapterId });

  const changed = renumber(target);
  if (scene.chapterId !== toChapterId) {
    // A scene that keeps its position number but changes chapter is still a change.
    if (!changed.some((s) => s.id === sceneId)) changed.push(target.find((s) => s.id === sceneId)!);
    changed.push(...renumber(othersIn(scene.chapterId)));
  }
  return changed;
}

/** Position for appending a new item after the given siblings. */
export function nextPosition(siblings: readonly { position: number }[]): number {
  return siblings.reduce((max, s) => Math.max(max, s.position + 1), 0);
}

/** Assigns positions 0..n-1 in list order and returns only the items whose position changed. */
function renumber<T extends { position: number }>(ordered: readonly T[]): T[] {
  return ordered.flatMap((item, index) => (item.position === index ? [] : [{ ...item, position: index }]));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
