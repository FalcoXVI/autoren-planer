import { moveItem } from "../domain/ordering";
import { byPosition } from "../domain/scope";
import type { Chapter, Scene } from "../domain/types";

/**
 * Order of chapters and scenes as shown on the plot board. During a drag the
 * board renders a draft layout; only the final drop is written to the database.
 */
export interface BoardLayout {
  chapterIds: string[];
  scenesByChapter: Record<string, string[]>;
}

/** Builds the layout of the given (already filtered and sorted) chapters. */
export function buildLayout(chapters: readonly Chapter[], scenes: readonly Scene[]): BoardLayout {
  const scenesByChapter: Record<string, string[]> = {};
  for (const chapter of chapters) scenesByChapter[chapter.id] = [];
  for (const scene of [...scenes].sort(byPosition)) scenesByChapter[scene.chapterId]?.push(scene.id);
  return { chapterIds: chapters.map((c) => c.id), scenesByChapter };
}

export function chapterOfScene(layout: BoardLayout, sceneId: string): string | undefined {
  return layout.chapterIds.find((id) => layout.scenesByChapter[id]?.includes(sceneId));
}

/**
 * Moves a scene into another chapter, before `beforeSceneId` or at the end.
 * Returns the layout unchanged if the scene is unknown.
 */
export function moveSceneAcross(
  layout: BoardLayout,
  sceneId: string,
  toChapterId: string,
  beforeSceneId?: string,
): BoardLayout {
  const from = chapterOfScene(layout, sceneId);
  if (!from || from === toChapterId) return layout;
  const source = layout.scenesByChapter[from]!.filter((id) => id !== sceneId);
  const target = [...(layout.scenesByChapter[toChapterId] ?? [])];
  const index = beforeSceneId ? target.indexOf(beforeSceneId) : -1;
  target.splice(index < 0 ? target.length : index, 0, sceneId);
  return { ...layout, scenesByChapter: { ...layout.scenesByChapter, [from]: source, [toChapterId]: target } };
}

/** Moves a scene to the slot of `overSceneId` within its chapter. */
export function moveSceneWithin(layout: BoardLayout, sceneId: string, overSceneId: string): BoardLayout {
  const chapterId = chapterOfScene(layout, sceneId);
  const ids = chapterId ? layout.scenesByChapter[chapterId]! : [];
  const from = ids.indexOf(sceneId);
  const to = ids.indexOf(overSceneId);
  if (!chapterId || from < 0 || to < 0 || from === to) return layout;
  return { ...layout, scenesByChapter: { ...layout.scenesByChapter, [chapterId]: moveItem(ids, from, to) } };
}

/** Moves a chapter to the slot of `overChapterId`. */
export function moveChapterTo(layout: BoardLayout, chapterId: string, overChapterId: string): BoardLayout {
  const from = layout.chapterIds.indexOf(chapterId);
  const to = layout.chapterIds.indexOf(overChapterId);
  if (from < 0 || to < 0 || from === to) return layout;
  return { ...layout, chapterIds: moveItem(layout.chapterIds, from, to) };
}

export function sameLayout(a: BoardLayout, b: BoardLayout): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
