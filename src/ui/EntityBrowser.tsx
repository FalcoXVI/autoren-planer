import { useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import type { OwnerRef } from "../domain/types";
import { displayName, reportError } from "./actions";

interface BrowsableEntity {
  id: string;
  name: string;
  owner: OwnerRef;
}

interface EntityBrowserProps<T extends BrowsableEntity> {
  /** Entities visible in the current book. */
  items: T[];
  /** Entity shown in the detail pane; may lie outside `items` when reached via a link. */
  selected: T | undefined;
  /** Route segment of the section, e.g. "characters". */
  section: string;
  createPlaceholder: string;
  emptyText: string;
  onCreate: (name: string) => Promise<T>;
  renderDetail: (item: T) => ReactNode;
}

/**
 * List/detail layout for characters and locations. On narrow screens only one
 * of both panes is shown at a time.
 */
export function EntityBrowser<T extends BrowsableEntity>(props: EntityBrowserProps<T>) {
  const { items, selected, section, createPlaceholder, emptyText, onCreate, renderDetail } = props;
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const entity = await onCreate(name.trim());
      setName("");
      navigate(`../${section}/${entity.id}`);
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div className={`browser${selected ? " has-selection" : ""}`}>
      <aside className="browser-list card">
        <form className="inline-form" onSubmit={create}>
          <input aria-label={createPlaceholder} placeholder={createPlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="primary">
            +
          </button>
        </form>
        {items.length === 0 && <p className="muted">{emptyText}</p>}
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <NavLink to={`../${section}/${item.id}`}>
                {displayName(item.name)}
                {item.owner.kind === "series" && <span className="badge">Reihe</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>
      <div className="browser-detail">
        {selected ? (
          <>
            <Link to={`../${section}`} className="back only-mobile">
              ← Zur Liste
            </Link>
            {renderDetail(selected)}
          </>
        ) : (
          <p className="muted only-desktop">Wähle links einen Eintrag oder lege einen neuen an.</p>
        )}
      </div>
    </div>
  );
}
