import type { Book, Chapter, Character, Location, OwnerRef, Scene, Workspace } from "./types";

/** Owners whose world entities are visible inside the given book. */
export function ownersVisibleIn(book: Book): OwnerRef[] {
  const owners: OwnerRef[] = [{ kind: "book", id: book.id }];
  if (book.seriesId) owners.push({ kind: "series", id: book.seriesId });
  return owners;
}

/**
 * Owner for newly created world entities: the series if the book belongs to
 * one (so recurring characters are shared right away), otherwise the book.
 */
export function defaultOwner(book: Book): OwnerRef {
  return book.seriesId ? { kind: "series", id: book.seriesId } : { kind: "book", id: book.id };
}

function isVisibleIn(owner: OwnerRef, book: Book): boolean {
  return ownersVisibleIn(book).some((o) => o.kind === owner.kind && o.id === owner.id);
}

/** Characters usable in the book: its own plus those of its series. Sorted by name. */
export function charactersInBook(ws: Workspace, book: Book): Character[] {
  return sortByName(ws.characters.filter((c) => isVisibleIn(c.owner, book)));
}

/** Locations usable in the book: its own plus those of its series. Sorted by name. */
export function locationsInBook(ws: Workspace, book: Book): Location[] {
  return sortByName(ws.locations.filter((l) => isVisibleIn(l.owner, book)));
}

/** Chapters of the book in reading order. */
export function chaptersOf(ws: Workspace, bookId: string): Chapter[] {
  return ws.chapters.filter((c) => c.bookId === bookId).sort(byPosition);
}

/** Scenes of the chapter in reading order. */
export function scenesOf(ws: Workspace, chapterId: string): Scene[] {
  return ws.scenes.filter((s) => s.chapterId === chapterId).sort(byPosition);
}

/** Books of a series (or standalone books for `null`), sorted by title. */
export function booksInSeries(ws: Workspace, seriesId: string | null): Book[] {
  return ws.books
    .filter((b) => b.seriesId === seriesId)
    .sort((a, b) => a.title.localeCompare(b.title, "de"));
}

export function byPosition(a: { position: number }, b: { position: number }): number {
  return a.position - b.position;
}

function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, "de"));
}
