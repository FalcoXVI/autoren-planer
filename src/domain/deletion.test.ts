import { describe, expect, it } from "vitest";
import { DeletionBlockedError, planDeletion } from "./deletion";
import { sampleWorkspace } from "./fixtures";

describe("planDeletion", () => {
  it("removes a character and its references from all scenes", () => {
    const plan = planDeletion(sampleWorkspace(), { collection: "characters", id: "anna" });
    expect(plan.remove.characters).toEqual(["anna"]);
    expect(plan.sceneUpdates.map((s) => [s.id, s.characterIds])).toEqual([
      ["s1", ["ben"]],
      ["s2", []],
      ["s4", []],
    ]);
  });

  it("removes a chapter with its scenes", () => {
    const plan = planDeletion(sampleWorkspace(), { collection: "chapters", id: "c1" });
    expect(plan.remove.chapters).toEqual(["c1"]);
    expect(plan.remove.scenes).toEqual(["s1", "s2"]);
    expect(plan.sceneUpdates).toEqual([]);
  });

  it("removes a book with chapters, scenes and book-owned entities but keeps series entities", () => {
    const plan = planDeletion(sampleWorkspace(), { collection: "books", id: "B1" });
    expect(plan.remove.books).toEqual(["B1"]);
    expect(plan.remove.chapters).toEqual(["c1", "c2"]);
    expect(plan.remove.scenes).toEqual(["s1", "s2", "s3"]);
    expect(plan.remove.characters).toEqual(["ben"]);
    expect(plan.remove.locations).toEqual(["tower"]);
    // Surviving scene s4 in B2 never referenced ben or the tower.
    expect(plan.sceneUpdates).toEqual([]);
  });

  it("blocks deleting a series that still contains books", () => {
    expect(() => planDeletion(sampleWorkspace(), { collection: "series", id: "S" })).toThrow(DeletionBlockedError);
  });

  it("deletes an empty series with its shared entities", () => {
    const ws = sampleWorkspace();
    ws.books = ws.books.filter((b) => b.seriesId !== "S");
    ws.scenes = [];
    const plan = planDeletion(ws, { collection: "series", id: "S" });
    expect(plan.remove.series).toEqual(["S"]);
    expect(plan.remove.characters).toEqual(["anna"]);
    expect(plan.remove.locations).toEqual(["harbor"]);
  });
});
