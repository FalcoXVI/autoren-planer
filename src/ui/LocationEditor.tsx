import { useNavigate } from "react-router-dom";
import { repository } from "../data/instance";
import type { Book, Editable, Location, Workspace } from "../domain/types";
import { Appearances } from "./Appearances";
import { confirmAndDelete, displayName, reportError } from "./actions";
import { Field } from "./Field";
import { OwnerSelect } from "./OwnerSelect";

interface LocationEditorProps {
  location: Location;
  book: Book;
  ws: Workspace;
}

/** Description of a location plus the scenes and characters found there. */
export function LocationEditor({ location, book, ws }: LocationEditorProps) {
  const navigate = useNavigate();
  const save = (changes: Partial<Editable<Location>>) =>
    repository.update("locations", location.id, changes).catch(reportError);

  const remove = async () => {
    const deleted = await confirmAndDelete(
      { collection: "locations", id: location.id },
      `Ort „${displayName(location.name)}" löschen? Er wird auch aus allen Szenen entfernt.`,
    );
    if (deleted) navigate("../locations");
  };

  return (
    <div className="editor">
      <section className="card">
        <Field label="Name" value={location.name} onCommit={(name) => save({ name })} />
        <Field label="Art" placeholder="z. B. Stadt, Region, Taverne" value={location.kind} onCommit={(kind) => save({ kind })} />
        <OwnerSelect owner={location.owner} book={book} ws={ws} onChange={(owner) => save({ owner })} />
        <Field label="Beschreibung" multiline value={location.description} onCommit={(description) => save({ description })} />
        <Field label="Notizen" multiline value={location.notes} onCommit={(notes) => save({ notes })} />
      </section>
      <Appearances ws={ws} kind="location" entityId={location.id} bookId={book.id} />
      <div className="actions">
        <button className="danger" onClick={remove}>
          Ort löschen
        </button>
      </div>
    </div>
  );
}
