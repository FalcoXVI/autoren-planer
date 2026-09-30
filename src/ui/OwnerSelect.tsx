import type { Book, OwnerRef, Workspace } from "../domain/types";
import { displayName } from "./actions";

interface OwnerSelectProps {
  owner: OwnerRef;
  book: Book;
  ws: Workspace;
  onChange: (owner: OwnerRef) => void;
}

/**
 * Lets the author decide whether an entity belongs to the whole series or only
 * to the current book. Entities of other books are shown read-only.
 */
export function OwnerSelect({ owner, book, ws, onChange }: OwnerSelectProps) {
  const series = ws.series.find((s) => s.id === book.seriesId);
  const ownedHere = (owner.kind === "book" && owner.id === book.id) || (owner.kind === "series" && owner.id === series?.id);

  if (!ownedHere) {
    const home =
      owner.kind === "book"
        ? `Buch „${displayName(ws.books.find((b) => b.id === owner.id)?.title ?? "")}"`
        : `Reihe „${displayName(ws.series.find((s) => s.id === owner.id)?.name ?? "")}"`;
    return <p className="hint">Gehört zu: {home}</p>;
  }
  if (!series) return null;

  return (
    <div className="field">
      <label htmlFor="owner-select">Gehört zu</label>
      <select
        id="owner-select"
        value={owner.kind}
        onChange={(e) =>
          onChange(e.target.value === "series" ? { kind: "series", id: series.id } : { kind: "book", id: book.id })
        }
      >
        <option value="series">ganzer Reihe „{displayName(series.name)}"</option>
        <option value="book">nur diesem Buch</option>
      </select>
    </div>
  );
}
