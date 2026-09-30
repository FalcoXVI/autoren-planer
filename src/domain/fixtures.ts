import type { Book, Chapter, Character, Location, Scene, Series, Workspace } from "./types";

/** Test data builders with sensible defaults; only the relevant fields need to be passed. */
const base = (id: string) => ({ id, updatedAt: 0, deleted: false });

export const series = (id: string, p: Partial<Series> = {}): Series => ({ ...base(id), name: id, description: "", ...p });
export const book = (id: string, p: Partial<Book> = {}): Book => ({
  ...base(id),
  title: id,
  seriesId: null,
  synopsis: "",
  ...p,
});
export const chapter = (id: string, bookId: string, position: number): Chapter => ({
  ...base(id),
  bookId,
  title: id,
  position,
});
export const scene = (id: string, bookId: string, chapterId: string, position: number, p: Partial<Scene> = {}): Scene => ({
  ...base(id),
  bookId,
  chapterId,
  title: id,
  summary: "",
  position,
  characterIds: [],
  locationIds: [],
  ...p,
});
export const character = (id: string, owner: Character["owner"], p: Partial<Character> = {}): Character => ({
  ...base(id),
  owner,
  name: id,
  role: "",
  description: "",
  traits: "",
  backstory: "",
  notes: "",
  ...p,
});
export const location = (id: string, owner: Location["owner"], p: Partial<Location> = {}): Location => ({
  ...base(id),
  owner,
  name: id,
  kind: "",
  description: "",
  notes: "",
  ...p,
});

export const emptyWorkspace = (): Workspace => ({
  series: [],
  books: [],
  chapters: [],
  scenes: [],
  characters: [],
  locations: [],
});

/**
 * A series "S" with books "B1" and "B2", plus a standalone book "B3".
 * B1 has chapters c1 (scenes s1, s2) and c2 (scene s3); B2 has chapter c3 (scene s4).
 * Characters: "anna" (series), "ben" (B1 only), "cleo" (B3 only).
 * Locations: "harbor" (series), "tower" (B1 only).
 */
export function sampleWorkspace(): Workspace {
  return {
    series: [series("S")],
    books: [book("B1", { seriesId: "S" }), book("B2", { seriesId: "S" }), book("B3")],
    chapters: [chapter("c1", "B1", 0), chapter("c2", "B1", 1), chapter("c3", "B2", 0)],
    scenes: [
      scene("s1", "B1", "c1", 0, { characterIds: ["anna", "ben"], locationIds: ["harbor"] }),
      scene("s2", "B1", "c1", 1, { characterIds: ["anna"], locationIds: ["tower"] }),
      scene("s3", "B1", "c2", 0, { characterIds: ["ben"], locationIds: ["harbor"] }),
      scene("s4", "B2", "c3", 0, { characterIds: ["anna"], locationIds: ["harbor"] }),
    ],
    characters: [
      character("anna", { kind: "series", id: "S" }),
      character("ben", { kind: "book", id: "B1" }),
      character("cleo", { kind: "book", id: "B3" }),
    ],
    locations: [location("harbor", { kind: "series", id: "S" }), location("tower", { kind: "book", id: "B1" })],
  };
}
