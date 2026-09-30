import { describe, expect, it } from "vitest";
import { sampleWorkspace } from "./fixtures";
import { appearancesOf, coOccurrences, toggleLink, unlinkEverywhere } from "./links";
import { charactersInBook, locationsInBook } from "./scope";

describe("appearancesOf", () => {
  it("finds a series character in scenes of all books, in reading order", () => {
    const ws = sampleWorkspace();
    const result = appearancesOf(ws, "character", "anna");
    expect(result.map((a) => [a.book.id, a.scene.id])).toEqual([
      ["B1", "s1"],
      ["B1", "s2"],
      ["B2", "s4"],
    ]);
  });

  it("finds the scenes at a location", () => {
    const ws = sampleWorkspace();
    expect(appearancesOf(ws, "location", "harbor").map((a) => a.scene.id)).toEqual(["s1", "s3", "s4"]);
  });
});

describe("coOccurrences", () => {
  it("lists the locations a character visits with scene counts", () => {
    const ws = sampleWorkspace();
    expect(coOccurrences(ws, "character", "anna", "location")).toEqual(
      new Map([
        ["harbor", 2],
        ["tower", 1],
      ]),
    );
  });

  it("lists the characters a character meets, excluding itself", () => {
    const ws = sampleWorkspace();
    expect(coOccurrences(ws, "character", "anna", "character")).toEqual(new Map([["ben", 1]]));
  });

  it("lists the characters seen at a location", () => {
    const ws = sampleWorkspace();
    expect(coOccurrences(ws, "location", "harbor", "character")).toEqual(
      new Map([
        ["anna", 2],
        ["ben", 2],
      ]),
    );
  });
});

describe("toggleLink / unlinkEverywhere", () => {
  it("adds and removes a reference", () => {
    const [s1] = sampleWorkspace().scenes;
    const added = toggleLink(s1!, "location", "tower");
    expect(added.locationIds).toEqual(["harbor", "tower"]);
    expect(toggleLink(added, "location", "tower").locationIds).toEqual(["harbor"]);
  });

  it("returns only the scenes that referenced the entity", () => {
    const changed = unlinkEverywhere(sampleWorkspace().scenes, "character", "ben");
    expect(changed.map((s) => s.id)).toEqual(["s1", "s3"]);
    expect(changed.every((s) => !s.characterIds.includes("ben"))).toBe(true);
  });
});

describe("scope", () => {
  it("shows series entities in every book of the series, book entities only in their book", () => {
    const ws = sampleWorkspace();
    const [b1, b2, b3] = ws.books;
    expect(charactersInBook(ws, b1!).map((c) => c.id)).toEqual(["anna", "ben"]);
    expect(charactersInBook(ws, b2!).map((c) => c.id)).toEqual(["anna"]);
    expect(charactersInBook(ws, b3!).map((c) => c.id)).toEqual(["cleo"]);
    expect(locationsInBook(ws, b2!).map((l) => l.id)).toEqual(["harbor"]);
  });
});
