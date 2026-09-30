import { Link, NavLink } from "react-router-dom";

/** Top bar with the app name and global navigation. */
export function Header() {
  return (
    <header className="app-header">
      <Link to="/" className="brand">
        Autoren-Planer
      </Link>
      <nav>
        <NavLink to="/" end>
          Bücher
        </NavLink>
        <NavLink to="/data">Daten</NavLink>
      </nav>
    </header>
  );
}
