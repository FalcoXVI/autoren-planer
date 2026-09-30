import { z } from "zod";
import type { Book, Chapter, Character, Location, Scene, Series, Workspace } from "./types";

/** Identifies backup files of this app; guards against importing unrelated JSON. */
export const BACKUP_FORMAT = "autoren-planer-backup";
/** Bump when the stored shape changes incompatibly and add a migration in `parseBackup`. */
export const BACKUP_VERSION = 1;

const base = { id: z.string().min(1), updatedAt: z.number(), deleted: z.boolean() };
const owner = z.object({ kind: z.enum(["series", "book"]), id: z.string().min(1) });

// `satisfies` makes the compiler check that the schemas match the domain types.
const seriesSchema = z.object({ ...base, name: z.string(), description: z.string() }) satisfies z.ZodType<Series>;
const bookSchema = z.object({
  ...base,
  title: z.string(),
  seriesId: z.string().nullable(),
  synopsis: z.string(),
}) satisfies z.ZodType<Book>;
const characterSchema = z.object({
  ...base,
  owner,
  name: z.string(),
  role: z.string(),
  description: z.string(),
  traits: z.string(),
  backstory: z.string(),
  notes: z.string(),
}) satisfies z.ZodType<Character>;
const locationSchema = z.object({
  ...base,
  owner,
  name: z.string(),
  kind: z.string(),
  description: z.string(),
  notes: z.string(),
}) satisfies z.ZodType<Location>;
const chapterSchema = z.object({
  ...base,
  bookId: z.string(),
  title: z.string(),
  position: z.number(),
}) satisfies z.ZodType<Chapter>;
const sceneSchema = z.object({
  ...base,
  bookId: z.string(),
  chapterId: z.string(),
  title: z.string(),
  summary: z.string(),
  position: z.number(),
  characterIds: z.array(z.string()),
  locationIds: z.array(z.string()),
}) satisfies z.ZodType<Scene>;

const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  data: z.object({
    series: z.array(seriesSchema),
    books: z.array(bookSchema),
    chapters: z.array(chapterSchema),
    scenes: z.array(sceneSchema),
    characters: z.array(characterSchema),
    locations: z.array(locationSchema),
  }),
});

export type Backup = z.infer<typeof backupSchema>;

/** Thrown when an imported file is not a valid, consistent backup. */
export class BackupFormatError extends Error {}

/** Wraps the workspace into the versioned backup envelope. */
export function createBackup(ws: Workspace, now: Date): Backup {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), data: ws };
}

/** Serializes a backup as pretty-printed JSON so it stays human-readable. */
export function serializeBackup(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

/**
 * Parses and validates backup JSON, including referential integrity.
 *
 * @throws BackupFormatError with a description of the first problem found.
 */
export function parseBackup(json: string): Workspace {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new BackupFormatError("File is not valid JSON");
  }
  const result = backupSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new BackupFormatError(`Invalid backup at "${issue?.path.join(".")}": ${issue?.message}`);
  }
  const ws = result.data.data;
  checkReferences(ws);
  return ws;
}

function checkReferences(ws: Workspace): void {
  const ids = (items: { id: string }[]) => new Set(items.map((i) => i.id));
  const series = ids(ws.series);
  const books = ids(ws.books);
  const chapters = ids(ws.chapters);
  const fail = (what: string, id: string) => {
    throw new BackupFormatError(`${what} ${id} references a missing record`);
  };

  for (const b of ws.books) if (b.seriesId && !series.has(b.seriesId)) fail("Book", b.id);
  for (const c of ws.chapters) if (!books.has(c.bookId)) fail("Chapter", c.id);
  for (const s of ws.scenes) if (!chapters.has(s.chapterId) || !books.has(s.bookId)) fail("Scene", s.id);
  for (const e of [...ws.characters, ...ws.locations]) {
    const owners = e.owner.kind === "book" ? books : series;
    if (!owners.has(e.owner.id)) fail("World entity", e.id);
  }
}
