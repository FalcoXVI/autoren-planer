import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { repository } from "../data/instance";
import { booksInSeries } from "../domain/scope";
import type { Book, Workspace } from "../domain/types";
import { confirmAndDelete, displayName, reportError } from "./actions";
import { Field } from "./Field";
import { useWorkspace } from "./useWorkspace";

/** Overview of all series and books, with forms to create both. */
export function HomePage() {
  const ws = useWorkspace();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [seriesName, setSeriesName] = useState("");

  const createBook = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const book = await repository.createBook(title.trim(), seriesId || null, "Kapitel 1");
      navigate(`/book/${book.id}/plot`);
    } catch (error) {
      reportError(error);
    }
  };

  const createSeries = async (e: FormEvent) => {
    e.preventDefault();
    if (!seriesName.trim()) return;
    await repository.createSeries(seriesName.trim()).catch(reportError);
    setSeriesName("");
  };

  const series = [...ws.series].sort((a, b) => a.name.localeCompare(b.name, "de"));
  const standalone = booksInSeries(ws, null);

  return (
    <div className="page">
      <h1>Deine Bücher</h1>

      <section className="card">
        <h2>Neues Buch</h2>
        <form className="inline-form" onSubmit={createBook}>
          <input aria-label="Titel des Buchs" placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select aria-label="Reihe" value={seriesId} onChange={(e) => setSeriesId(e.target.value)}>
            <option value="">Einzelband</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                Reihe: {displayName(s.name)}
              </option>
            ))}
          </select>
          <button type="submit" className="primary">
            Anlegen
          </button>
        </form>
      </section>

      {series.map((s) => (
        <section key={s.id} className="card">
          <div className="card-head">
            <Field label="Name der Reihe" hideLabel value={s.name} onCommit={(name) => repository.update("series", s.id, { name }).catch(reportError)} />
            <button
              className="danger subtle"
              onClick={() => confirmAndDelete({ collection: "series", id: s.id }, `Reihe „${displayName(s.name)}" mit allen gemeinsamen Figuren und Orten löschen?`)}
            >
              Löschen
            </button>
          </div>
          <p className="muted">Reihe – Figuren und Orte der Reihe stehen in allen ihren Büchern zur Verfügung.</p>
          <BookList books={booksInSeries(ws, s.id)} ws={ws} empty="Noch keine Bücher in dieser Reihe." />
        </section>
      ))}

      <section className="card">
        <h2>Einzelbände</h2>
        <BookList books={standalone} ws={ws} empty="Noch keine Einzelbände." />
      </section>

      <section className="card">
        <h2>Neue Reihe</h2>
        <form className="inline-form" onSubmit={createSeries}>
          <input aria-label="Name der Reihe" placeholder="Name der Reihe" value={seriesName} onChange={(e) => setSeriesName(e.target.value)} />
          <button type="submit">Reihe anlegen</button>
        </form>
      </section>
    </div>
  );
}

function BookList({ books, ws, empty }: { books: Book[]; ws: Workspace; empty: string }) {
  if (books.length === 0) return <p className="muted">{empty}</p>;
  return (
    <ul className="book-list">
      {books.map((b) => {
        const chapters = ws.chapters.filter((c) => c.bookId === b.id).length;
        const scenes = ws.scenes.filter((s) => s.bookId === b.id).length;
        return (
          <li key={b.id}>
            <Link to={`/book/${b.id}/plot`}>
              <strong>{displayName(b.title)}</strong>
              <span className="muted">
                {chapters} Kapitel · {scenes} Szenen
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
