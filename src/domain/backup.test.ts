import { describe, expect, it } from "vitest";
import { BackupFormatError, createBackup, parseBackup, serializeBackup } from "./backup";
import { sampleWorkspace } from "./fixtures";

const now = new Date("2026-09-30T10:00:00Z");

describe("backup", () => {
  it("round-trips a workspace", () => {
    const ws = sampleWorkspace();
    expect(parseBackup(serializeBackup(createBackup(ws, now)))).toEqual(ws);
  });

  it("rejects non-JSON", () => {
    expect(() => parseBackup("not json")).toThrow(BackupFormatError);
  });

  it("rejects JSON from another app", () => {
    expect(() => parseBackup(JSON.stringify({ hello: "world" }))).toThrow(BackupFormatError);
  });

  it("rejects records with missing fields", () => {
    const backup = createBackup(sampleWorkspace(), now) as unknown as { data: { books: object[] } };
    backup.data.books[0] = { id: "B1" };
    expect(() => parseBackup(JSON.stringify(backup))).toThrow(/books/);
  });

  it("rejects scenes pointing to missing chapters", () => {
    const ws = sampleWorkspace();
    ws.chapters = ws.chapters.filter((c) => c.id !== "c3");
    expect(() => parseBackup(serializeBackup(createBackup(ws, now)))).toThrow(/Scene s4/);
  });
});
