/**
 * Fields shared by every stored record. `updatedAt` and `deleted` prepare the
 * data for the later sync server (last-write-wins with tombstones).
 */
export interface BaseRecord {
  /** Globally unique id (UUID v4), stable across devices. */
  id: string;
  /** Epoch milliseconds of the last change. */
  updatedAt: number;
  /** Soft-delete marker; deleted records stay stored so deletions can be synced. */
  deleted: boolean;
}

/** A series groups books that share one world and recurring characters. */
export interface Series extends BaseRecord {
  name: string;
  description: string;
}

export interface Book extends BaseRecord {
  title: string;
  /** Series the book belongs to, or null for a standalone book. */
  seriesId: string | null;
  synopsis: string;
}

/**
 * Owner of a world entity. Entities owned by a series are visible in all of
 * its books; entities owned by a book only in that book.
 */
export interface OwnerRef {
  kind: "series" | "book";
  id: string;
}

export interface Character extends BaseRecord {
  owner: OwnerRef;
  name: string;
  /** Narrative role, e.g. "Protagonistin" or "Mentor". */
  role: string;
  description: string;
  traits: string;
  backstory: string;
  notes: string;
}

export interface Location extends BaseRecord {
  owner: OwnerRef;
  name: string;
  /** Free-form category, e.g. "Stadt", "Region", "Taverne". */
  kind: string;
  description: string;
  notes: string;
}

export interface Chapter extends BaseRecord {
  bookId: string;
  title: string;
  /** Zero-based order within the book. */
  position: number;
}

export interface Scene extends BaseRecord {
  bookId: string;
  chapterId: string;
  title: string;
  summary: string;
  /** Zero-based order within the chapter. */
  position: number;
  characterIds: string[];
  locationIds: string[];
}

/** All live (non-deleted) records the UI works with. */
export interface Workspace {
  series: Series[];
  books: Book[];
  chapters: Chapter[];
  scenes: Scene[];
  characters: Character[];
  locations: Location[];
}

/** Names of the record collections, identical to the database table names. */
export type CollectionName = keyof Workspace;

/** Maps a collection name to the record type it stores. */
export type RecordOf<C extends CollectionName> = Workspace[C][number];

/** The user-editable part of a record, i.e. everything except the bookkeeping fields. */
export type Editable<T extends BaseRecord> = Omit<T, keyof BaseRecord>;

/** World entities that scenes can reference. */
export type LinkKind = "character" | "location";

export const COLLECTIONS: readonly CollectionName[] = [
  "series",
  "books",
  "chapters",
  "scenes",
  "characters",
  "locations",
];
