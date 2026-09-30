import { useNavigate } from "react-router-dom";
import { repository } from "../data/instance";
import type { Book, Editable } from "../domain/types";
import { confirmAndDelete, displayName, reportError } from "./actions";
import { Field } from "./Field";
import { useCurrentBook } from "./useCurrentBook";
import { useWorkspace } from "./useWorkspace";

/** Title, series membership and synopsis of the current book. */
export function BookDetails() {
  const book = useCurrentBook();
  const ws = useWorkspace();
  const navigate = useNavigate();
  const save = (changes: Partial<Editable<Book>>) =>
    repository.update("books", book.id, changes).catch(reportError);

  const remove = async () => {
    const deleted = await confirmAndDelete(
      { collection: "books", id: book.id },
      `„${displayName(book.title)}" mit allen Kapiteln, Szenen und den nur hier verwendeten Figuren und Orten löschen?`,
    );
    if (deleted) navigate("/");
  };

  return (
    <section className="card" key={book.id}>
      <Field label="Titel" value={book.title} onCommit={(title) => save({ title })} />
      <div className="field">
        <label htmlFor="series-select">Reihe</label>
        <select id="series-select" value={book.seriesId ?? ""} onChange={(e) => save({ seriesId: e.target.value || null })}>
          <option value="">Einzelband</option>
          {ws.series.map((s) => (
            <option key={s.id} value={s.id}>
              {displayName(s.name)}
            </option>
          ))}
        </select>
        <p className="hint">Figuren und Orte einer Reihe sind in allen Büchern der Reihe verfügbar.</p>
      </div>
      <Field label="Worum geht es? (Exposé)" multiline value={book.synopsis} onCommit={(synopsis) => save({ synopsis })} />
      <div className="actions">
        <button className="danger" onClick={remove}>
          Buch löschen
        </button>
      </div>
    </section>
  );
}
