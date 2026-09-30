import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { displayName } from "./actions";
import { useWorkspace } from "./useWorkspace";

/** Frame for all pages of one book: title, section tabs and the active section. */
export function BookPage() {
  const { bookId } = useParams();
  const ws = useWorkspace();
  const book = ws.books.find((b) => b.id === bookId);

  if (!book) {
    return (
      <div className="page">
        <p>Dieses Buch gibt es nicht (mehr).</p>
        <Link to="/">Zur Übersicht</Link>
      </div>
    );
  }

  const series = ws.series.find((s) => s.id === book.seriesId);
  return (
    <div className="page">
      <div className="book-head">
        {series && <span className="muted">{displayName(series.name)}</span>}
        <h1>{displayName(book.title)}</h1>
      </div>
      <nav className="tabs">
        <NavLink to="plot">Plot</NavLink>
        <NavLink to="characters">Figuren</NavLink>
        <NavLink to="locations">Orte</NavLink>
        <NavLink to="details">Buch</NavLink>
      </nav>
      <Outlet context={book} />
    </div>
  );
}
