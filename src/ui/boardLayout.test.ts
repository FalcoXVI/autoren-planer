import { describe, expect, it } from "vitest";
import { chapter, scene } from "../domain/fixtures";
import { buildLayout, chapterOfScene, moveChapterTo, moveSceneAcross, moveSceneWithin, sameLayout } from "./boardLayout";

const layout = buildLayout(
  [chapter("k1", "B", 0), chapter("k2", "B", 1)],
  [scene("b", "B", "k1", 1), scene("a", "B", "k1", 0), scene("c", "B", "k2", 0), scene("x", "B", "other", 0)],
);

describe("boardLayout", () => {
  it("groups scenes per chapter in reading order and ignores foreign scenes", () => {
    expect(layout).toEqual({ chapterIds: ["k1", "k2"], scenesByChapter: { k1: ["a", "b"], k2: ["c"] } });
    expect(chapterOfScene(layout, "c")).toBe("k2");
  });

  it("moves a scene across chapters before another scene or to the end", () => {
    expect(moveSceneAcross(layout, "a", "k2", "c").scenesByChapter).toEqual({ k1: ["b"], k2: ["a", "c"] });
    expect(moveSceneAcross(layout, "a", "k2").scenesByChapter).toEqual({ k1: ["b"], k2: ["c", "a"] });
  });

  it("reorders within a chapter", () => {
    expect(moveSceneWithin(layout, "a", "b").scenesByChapter.k1).toEqual(["b", "a"]);
  });

  it("reorders chapters", () => {
    expect(moveChapterTo(layout, "k2", "k1").chapterIds).toEqual(["k2", "k1"]);
  });

  it("detects unchanged layouts", () => {
    expect(sameLayout(layout, moveSceneWithin(layout, "a", "a"))).toBe(true);
    expect(sameLayout(layout, moveChapterTo(layout, "k2", "k1"))).toBe(false);
  });
});
