import { planDeletion, type DeletionTarget } from "../domain/deletion";
import { newId } from "../domain/ids";
import { toggleLink } from "../domain/links";
import { moveScene, nextPosition, reorderChapter } from "../domain/ordering";
import type {
  BaseRecord,
  Book,
  Chapter,
  Character,
  CollectionName,
  Editable,
  LinkKind,
  Location,
  OwnerRef,
  RecordOf,
  Scene,
  Series,
} from "../domain/types";
import { COLLECTIONS } from "../domain/types";
import type { PlannerDatabase } from "./PlannerDatabase";

/**
 * All write operations of the app. Each operation runs in one IndexedDB
 * transaction and stamps `updatedAt`, so the data stays consistent and ready
 * for last-write-wins sync.
 */
export class PlannerRepository {
  constructor(
    private readonly db: PlannerDatabase,
    private readonly clock: () => number = Date.now,
  ) {}

  createSeries(name: string): Promise<Series> {
    return this.insert("series", { name, description: "" });
  }

  /** Creates a book together with its first chapter, so scenes can be added right away. */
  async createBook(title: string, seriesId: string | null, firstChapterTitle: string): Promise<Book> {
    return this.db.transaction("rw", this.db.books, this.db.chapters, async () => {
      const book = await this.insert("books", { title, seriesId, synopsis: "" });
      await this.insert("chapters", { bookId: book.id, title: firstChapterTitle, position: 0 });
      return book;
    });
  }

  async createChapter(bookId: string, title: string): Promise<Chapter> {
    return this.db.transaction("rw", this.db.chapters, async () => {
      const siblings = await this.liveWhere("chapters", "bookId", bookId);
      return this.insert("chapters", { bookId, title, position: nextPosition(siblings) });
    });
  }

  async createScene(chapterId: string, title: string): Promise<Scene> {
    return this.db.transaction("rw", this.db.chapters, this.db.scenes, async () => {
      const chapter = await this.db.chapters.get(chapterId);
      if (!chapter || chapter.deleted) throw new Error(`Unknown chapter ${chapterId}`);
      const siblings = await this.liveWhere("scenes", "chapterId", chapterId);
      return this.insert("scenes", {
        bookId: chapter.bookId,
        chapterId,
        title,
        summary: "",
        position: nextPosition(siblings),
        characterIds: [],
        locationIds: [],
      });
    });
  }

  createCharacter(owner: OwnerRef, name: string): Promise<Character> {
    return this.insert("characters", { owner, name, role: "", description: "", traits: "", backstory: "", notes: "" });
  }

  createLocation(owner: OwnerRef, name: string): Promise<Location> {
    return this.insert("locations", { owner, name, kind: "", description: "", notes: "" });
  }

  /** Applies a partial change to the editable fields of a record. */
  async update<C extends CollectionName>(
    collection: C,
    id: string,
    changes: Partial<Editable<RecordOf<C>>>,
  ): Promise<void> {
    const table = this.db.tableOf(collection);
    await this.db.transaction("rw", table, async () => {
      // `where` instead of `get`: Dexie cannot infer the key type of a generic table.
      const current = await table.where("id").equals(id).first();
      if (!current || current.deleted) throw new Error(`Unknown ${collection} record ${id}`);
      await table.put(this.stamp({ ...current, ...changes } as RecordOf<C>));
    });
  }

  /** Adds the reference if missing, removes it otherwise. */
  async toggleSceneLink(sceneId: string, kind: LinkKind, entityId: string): Promise<void> {
    await this.db.transaction("rw", this.db.scenes, async () => {
      const scene = await this.db.scenes.get(sceneId);
      if (!scene || scene.deleted) throw new Error(`Unknown scene ${sceneId}`);
      await this.db.scenes.put(this.stamp(toggleLink(scene, kind, entityId)));
    });
  }

  /** Moves a scene to a position within the same or another chapter of its book. */
  async moveScene(sceneId: string, toChapterId: string, toIndex: number): Promise<void> {
    await this.db.transaction("rw", this.db.scenes, async () => {
      const scene = await this.db.scenes.get(sceneId);
      if (!scene) throw new Error(`Unknown scene ${sceneId}`);
      const bookScenes = await this.liveWhere("scenes", "bookId", scene.bookId);
      const changed = moveScene(bookScenes, sceneId, toChapterId, toIndex);
      await this.db.scenes.bulkPut(changed.map((s) => this.stamp(s)));
    });
  }

  async moveChapter(chapterId: string, toIndex: number): Promise<void> {
    await this.db.transaction("rw", this.db.chapters, async () => {
      const chapter = await this.db.chapters.get(chapterId);
      if (!chapter) throw new Error(`Unknown chapter ${chapterId}`);
      const siblings = await this.liveWhere("chapters", "bookId", chapter.bookId);
      const changed = reorderChapter(siblings, chapterId, toIndex);
      await this.db.chapters.bulkPut(changed.map((c) => this.stamp(c)));
    });
  }

  /**
   * Soft-deletes the target and everything that depends on it (see `planDeletion`).
   *
   * @throws DeletionBlockedError if the deletion is not allowed.
   */
  async delete(target: DeletionTarget): Promise<void> {
    await this.db.transaction("rw", this.db.allTables(), async () => {
      const plan = planDeletion(await this.db.loadWorkspace(), target);
      const now = this.clock();
      for (const collection of COLLECTIONS) {
        const ids = plan.remove[collection];
        if (ids.length === 0) continue;
        await this.db.tableOf(collection).where("id").anyOf(ids).modify({ deleted: true, updatedAt: now });
      }
      await this.db.scenes.bulkPut(plan.sceneUpdates.map((s) => this.stamp(s)));
    });
  }

  private async insert<C extends CollectionName>(collection: C, fields: Editable<RecordOf<C>>): Promise<RecordOf<C>> {
    const record = { ...fields, id: newId(), updatedAt: this.clock(), deleted: false } as RecordOf<C>;
    await this.db.tableOf(collection).add(record);
    return record;
  }

  private async liveWhere<C extends "chapters" | "scenes">(
    collection: C,
    index: string,
    value: string,
  ): Promise<RecordOf<C>[]> {
    const rows = await this.db.tableOf(collection).where(index).equals(value).toArray();
    return rows.filter((r) => !r.deleted);
  }

  private stamp<T extends BaseRecord>(record: T): T {
    return { ...record, updatedAt: this.clock() };
  }
}
