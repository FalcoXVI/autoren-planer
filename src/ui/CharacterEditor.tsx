import { useNavigate } from "react-router-dom";
import { repository } from "../data/instance";
import type { Book, Character, Editable, Workspace } from "../domain/types";
import { Appearances } from "./Appearances";
import { confirmAndDelete, displayName, reportError } from "./actions";
import { Field } from "./Field";
import { OwnerSelect } from "./OwnerSelect";

interface CharacterEditorProps {
  character: Character;
  book: Book;
  ws: Workspace;
}

/** Profile of a character plus where it appears. */
export function CharacterEditor({ character, book, ws }: CharacterEditorProps) {
  const navigate = useNavigate();
  const save = (changes: Partial<Editable<Character>>) =>
    repository.update("characters", character.id, changes).catch(reportError);

  const remove = async () => {
    const deleted = await confirmAndDelete(
      { collection: "characters", id: character.id },
      `Figur „${displayName(character.name)}" löschen? Sie wird auch aus allen Szenen entfernt.`,
    );
    if (deleted) navigate("../characters");
  };

  return (
    <div className="editor">
      <section className="card">
        <Field label="Name" value={character.name} onCommit={(name) => save({ name })} />
        <Field label="Rolle" placeholder="z. B. Protagonistin, Mentor, Antagonist" value={character.role} onCommit={(role) => save({ role })} />
        <OwnerSelect owner={character.owner} book={book} ws={ws} onChange={(owner) => save({ owner })} />
        <Field label="Aussehen & Auftreten" multiline value={character.description} onCommit={(description) => save({ description })} />
        <Field label="Eigenschaften" multiline value={character.traits} onCommit={(traits) => save({ traits })} />
        <Field label="Hintergrund" multiline value={character.backstory} onCommit={(backstory) => save({ backstory })} />
        <Field label="Notizen" multiline value={character.notes} onCommit={(notes) => save({ notes })} />
      </section>
      <Appearances ws={ws} kind="character" entityId={character.id} bookId={book.id} />
      <div className="actions">
        <button className="danger" onClick={remove}>
          Figur löschen
        </button>
      </div>
    </div>
  );
}
