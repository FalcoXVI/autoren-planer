import Dexie, { type EntityTable } from "dexie";
import { COLLECTIONS, type CollectionName, type RecordOf, type Workspace } from "../domain/types";

/**
 * IndexedDB schema of the app. Every collection lives in its own table, keyed
 * by the record id. Deleted records remain as tombstones (`deleted: true`).
 */
export class PlannerDatabase extends Dexie {
  series!: EntityTable<RecordOf<"series">, "id">;
  books!: EntityTable<RecordOf<"books">, "id">;
  chapters!: EntityTable<RecordOf<"chapters">, "id">;
  scenes!: EntityTable<RecordOf<"scenes">, "id">;
  characters!: EntityTable<RecordOf<"characters">, "id">;
  locations!: EntityTable<RecordOf<"locations">, "id">;

  constructor(name = "autoren-planer") {
    super(name);
    this.version(1).stores({
      series: "id",
      books: "id, seriesId",
      chapters: "id, bookId",
      scenes: "id, bookId, chapterId",
      characters: "id",
      locations: "id",
    });
  }

  /** Typed access to a table by collection name. */
  tableOf<C extends CollectionName>(collection: C): EntityTable<RecordOf<C>, "id"> {
    return this[collection] as unknown as EntityTable<RecordOf<C>, "id">;
  }

  /** All tables, e.g. for transactions spanning every collection. */
  allTables() {
    return COLLECTIONS.map((c) => this.tableOf(c));
  }

  /**
   * Loads every live record. The data set of a single author is small (a few MB),
   * so reading everything keeps queries trivial and the UI consistent.
   */
  async loadWorkspace(): Promise<Workspace> {
    const live = async <C extends CollectionName>(c: C) =>
      (await this.tableOf(c).toArray()).filter((r) => !r.deleted) as Workspace[C];
    const [series, books, chapters, scenes, characters, locations] = await Promise.all([
      live("series"),
      live("books"),
      live("chapters"),
      live("scenes"),
      live("characters"),
      live("locations"),
    ]);
    return { series, books, chapters, scenes, characters, locations };
  }
}
