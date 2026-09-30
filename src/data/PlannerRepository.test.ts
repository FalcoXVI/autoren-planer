import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BackupFormatError } from "../domain/backup";
import { scenesOf } from "../domain/scope";
import { BackupService } from "./BackupService";
import { PlannerDatabase } from "./PlannerDatabase";
import { PlannerRepository } from "./PlannerRepository";

let db: PlannerDatabase;
let repo: PlannerRepository;
let backup: BackupService;
let time: number;

beforeEach(() => {
  // A unique name per test gives each test a fresh database.
  db = new PlannerDatabase(`test-${Math.random()}`);
  time = 1000;
  const clock = () => ++time;
  repo = new PlannerRepository(db, clock);
  backup = new BackupService(db, clock);
});

afterEach(async () => {
  await db.delete();
});

describe("PlannerRepository", () => {
  it("persists a book with its first chapter across database instances", async () => {
    const book = await repo.createBook("Das Buch", null, "Kapitel 1");
    db.close();

    const reopened = new PlannerDatabase(db.name);
    const ws = await reopened.loadWorkspace();
    expect(ws.books.map((b) => b.title)).toEqual(["Das Buch"]);
    expect(ws.chapters).toMatchObject([{ bookId: book.id, title: "Kapitel 1", position: 0 }]);
    reopened.close();
  });

  it("links characters and locations to scenes and finds them back", async () => {
    const book = await repo.createBook("B", null, "K1");
    const [chapter] = (await db.loadWorkspace()).chapters;
    const scene = await repo.createScene(chapter!.id, "Ankunft");
    const anna = await repo.createCharacter({ kind: "book", id: book.id }, "Anna");
    const harbor = await repo.createLocation({ kind: "book", id: book.id }, "Hafen");

    await repo.toggleSceneLink(scene.id, "character", anna.id);
    await repo.toggleSceneLink(scene.id, "location", harbor.id);

    const stored = await db.scenes.get(scene.id);
    expect(stored).toMatchObject({ characterIds: [anna.id], locationIds: [harbor.id] });
    expect(stored!.updatedAt).toBeGreaterThan(scene.updatedAt);
  });

  it("moves scenes between chapters", async () => {
    const book = await repo.createBook("B", null, "K1");
    const k1 = (await db.loadWorkspace()).chapters[0]!;
    const k2 = await repo.createChapter(book.id, "K2");
    const a = await repo.createScene(k1.id, "a");
    const b = await repo.createScene(k1.id, "b");

    await repo.moveScene(a.id, k2.id, 0);

    const ws = await db.loadWorkspace();
    expect(scenesOf(ws, k1.id).map((s) => [s.id, s.position])).toEqual([[b.id, 0]]);
    expect(scenesOf(ws, k2.id).map((s) => [s.id, s.position])).toEqual([[a.id, 0]]);
  });

  it("reorders chapters", async () => {
    const book = await repo.createBook("B", null, "K1");
    const k2 = await repo.createChapter(book.id, "K2");
    await repo.moveChapter(k2.id, 0);
    const titles = (await db.loadWorkspace()).chapters.sort((x, y) => x.position - y.position).map((c) => c.title);
    expect(titles).toEqual(["K2", "K1"]);
  });

  it("soft-deletes a character and unlinks it from scenes", async () => {
    const book = await repo.createBook("B", null, "K1");
    const chapter = (await db.loadWorkspace()).chapters[0]!;
    const scene = await repo.createScene(chapter.id, "s");
    const anna = await repo.createCharacter({ kind: "book", id: book.id }, "Anna");
    await repo.toggleSceneLink(scene.id, "character", anna.id);

    await repo.delete({ collection: "characters", id: anna.id });

    const ws = await db.loadWorkspace();
    expect(ws.characters).toEqual([]);
    expect(ws.scenes[0]!.characterIds).toEqual([]);
    // The tombstone stays for the later sync.
    expect(await db.characters.get(anna.id)).toMatchObject({ deleted: true });
  });

  it("updates editable fields", async () => {
    const book = await repo.createBook("Alt", null, "K1");
    await repo.update("books", book.id, { title: "Neu", synopsis: "Worum es geht" });
    expect(await db.books.get(book.id)).toMatchObject({ title: "Neu", synopsis: "Worum es geht" });
  });
});

describe("BackupService", () => {
  it("restores exported data and replaces everything else", async () => {
    const series = await repo.createSeries("Saga");
    await repo.createBook("Teil 1", series.id, "K1");
    const json = await backup.exportJson();

    await repo.createBook("Später angelegt", null, "K1");
    await backup.importJson(json);

    const ws = await db.loadWorkspace();
    expect(ws.books.map((b) => b.title)).toEqual(["Teil 1"]);
    expect(ws.series.map((s) => s.name)).toEqual(["Saga"]);
  });

  it("leaves the data untouched when the file is invalid", async () => {
    await repo.createBook("Bleibt", null, "K1");
    await expect(backup.importJson("{}")).rejects.toThrow(BackupFormatError);
    expect((await db.loadWorkspace()).books.map((b) => b.title)).toEqual(["Bleibt"]);
  });
});
