import { Link } from "react-router-dom";
import { appearancesOf, coOccurrences } from "../domain/links";
import type { LinkKind, Workspace } from "../domain/types";
import { displayName } from "./actions";

interface AppearancesProps {
  ws: Workspace;
  kind: LinkKind;
  entityId: string;
  /** Book whose routes are used for links to other characters and locations. */
  bookId: string;
}

/**
 * Reverse links of a character or location: the scenes it appears in (across
 * all books) and the characters/locations it shares scenes with.
 */
export function Appearances({ ws, kind, entityId, bookId }: AppearancesProps) {
  const appearances = appearancesOf(ws, kind, entityId);
  const related = (otherKind: LinkKind) => {
    const counts = coOccurrences(ws, kind, entityId, otherKind);
    const all = otherKind === "character" ? ws.characters : ws.locations;
    return all.filter((e) => counts.has(e.id)).map((e) => ({ entity: e, count: counts.get(e.id)! }));
  };
  const groups =
    kind === "character"
      ? [
          { title: "Orte", kind: "location" as const, items: related("location") },
          { title: "Begegnet", kind: "character" as const, items: related("character") },
        ]
      : [{ title: "Figuren hier", kind: "character" as const, items: related("character") }];

  return (
    <section className="card">
      <h3>Kommt vor in {appearances.length} Szene(n)</h3>
      {appearances.length === 0 ? (
        <p className="muted">Noch in keiner Szene verknüpft. Verknüpfe sie im Szenen-Editor.</p>
      ) : (
        <ol className="appearances">
          {appearances.map(({ scene, chapter, book }) => (
            <li key={scene.id}>
              <Link to={`/book/${book.id}/scene/${scene.id}`}>{displayName(scene.title)}</Link>
              <span className="muted">
                {" "}
                – {book.id === bookId ? "" : `${displayName(book.title)}, `}
                {displayName(chapter.title)}
              </span>
            </li>
          ))}
        </ol>
      )}
      {groups.map((g) =>
        g.items.length === 0 ? null : (
          <div key={g.title}>
            <h4>{g.title}</h4>
            <div className="chips">
              {g.items.map(({ entity, count }) => (
                <Link
                  key={entity.id}
                  className={`chip ${g.kind}`}
                  to={`/book/${bookId}/${g.kind === "character" ? "characters" : "locations"}/${entity.id}`}
                >
                  {displayName(entity.name)} <span className="count">{count}×</span>
                </Link>
              ))}
            </div>
          </div>
        ),
      )}
    </section>
  );
}
