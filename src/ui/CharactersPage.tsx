import { useParams } from "react-router-dom";
import { repository } from "../data/instance";
import { charactersInBook, defaultOwner } from "../domain/scope";
import { CharacterEditor } from "./CharacterEditor";
import { EntityBrowser } from "./EntityBrowser";
import { useCurrentBook } from "./useCurrentBook";
import { useWorkspace } from "./useWorkspace";

/** Characters of the current book (including those shared by its series). */
export function CharactersPage() {
  const { entityId } = useParams();
  const book = useCurrentBook();
  const ws = useWorkspace();

  return (
    <EntityBrowser
      items={charactersInBook(ws, book)}
      selected={ws.characters.find((c) => c.id === entityId)}
      section="characters"
      createPlaceholder="Neue Figur"
      emptyText="Noch keine Figuren."
      onCreate={(name) => repository.createCharacter(defaultOwner(book), name)}
      renderDetail={(character) => <CharacterEditor key={character.id} character={character} book={book} ws={ws} />}
    />
  );
}
