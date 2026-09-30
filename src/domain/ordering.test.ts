import { describe, expect, it } from "vitest";
import { chapter, scene } from "./fixtures";
import { moveItem, moveScene, nextPosition, reorderChapter } from "./ordering";
import type { Scene } from "./types";

/** Applies the changed scenes and returns the scene ids per chapter in reading order. */
function layout(scenes: Scene[], changed: Scene[]): Record<string, string[]> {
  const byId = new Map(scenes.map((s) => [s.id, s]));
  for (const c of changed) byId.set(c.id, c);
  const result: Record<string, string[]> = {};
  for (const s of [...byId.values()].sort((a, b) => a.position - b.position)) {
    (result[s.chapterId] ??= []).push(s.id);
  }
  return result;
}

const scenes = [
  scene("a", "B", "c1", 0),
  scene("b", "B", "c1", 1),
  scene("c", "B", "c1", 2),
  scene("d", "B", "c2", 0),
];

describe("moveItem", () => {
  it("moves forward and backward", () => {
    expect(moveItem([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
    expect(moveItem([1, 2, 3, 4], 3, 0)).toEqual([4, 1, 2, 3]);
  });

  it("clamps the target index", () => {
    expect(moveItem([1, 2, 3], 0, 99)).toEqual([2, 3, 1]);
  });
});

describe("moveScene", () => {
  it("reorders within a chapter and returns only changed scenes", () => {
    const changed = moveScene(scenes, "c", "c1", 0);
    expect(layout(scenes, changed)).toEqual({ c1: ["c", "a", "b"], c2: ["d"] });
    expect(changed.map((s) => s.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("moves into another chapter and closes the gap in the source chapter", () => {
    const changed = moveScene(scenes, "a", "c2", 1);
    expect(layout(scenes, changed)).toEqual({ c1: ["b", "c"], c2: ["d", "a"] });
    expect(changed.find((s) => s.id === "a")?.chapterId).toBe("c2");
  });

  it("marks a scene as changed when only its chapter differs", () => {
    const changed = moveScene(scenes, "a", "c2", 0);
    expect(changed.find((s) => s.id === "a")).toMatchObject({ chapterId: "c2", position: 0 });
  });

  it("moves into an empty chapter", () => {
    const changed = moveScene(scenes, "d", "c3", 0);
    expect(layout(scenes, changed)).toEqual({ c1: ["a", "b", "c"], c3: ["d"] });
  });

  it("returns nothing when the scene stays in place", () => {
    expect(moveScene(scenes, "b", "c1", 1)).toEqual([]);
  });

  it("rejects unknown scenes", () => {
    expect(() => moveScene(scenes, "x", "c1", 0)).toThrow();
  });
});

describe("reorderChapter", () => {
  it("renumbers the chapters", () => {
    const chapters = [chapter("k1", "B", 0), chapter("k2", "B", 1), chapter("k3", "B", 2)];
    const changed = reorderChapter(chapters, "k3", 0);
    expect(changed.map((c) => [c.id, c.position])).toEqual([
      ["k3", 0],
      ["k1", 1],
      ["k2", 2],
    ]);
  });
});

describe("nextPosition", () => {
  it("appends after the highest position", () => {
    expect(nextPosition([])).toBe(0);
    expect(nextPosition([{ position: 0 }, { position: 4 }])).toBe(5);
  });
});
