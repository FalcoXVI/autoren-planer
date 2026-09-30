import { useParams } from "react-router-dom";
import { repository } from "../data/instance";
import { defaultOwner, locationsInBook } from "../domain/scope";
import { EntityBrowser } from "./EntityBrowser";
import { LocationEditor } from "./LocationEditor";
import { useCurrentBook } from "./useCurrentBook";
import { useWorkspace } from "./useWorkspace";

/** Locations of the current book (including those shared by its series). */
export function LocationsPage() {
  const { entityId } = useParams();
  const book = useCurrentBook();
  const ws = useWorkspace();

  return (
    <EntityBrowser
      items={locationsInBook(ws, book)}
      selected={ws.locations.find((l) => l.id === entityId)}
      section="locations"
      createPlaceholder="Neuer Ort"
      emptyText="Noch keine Orte."
      onCreate={(name) => repository.createLocation(defaultOwner(book), name)}
      renderDetail={(location) => <LocationEditor key={location.id} location={location} book={book} ws={ws} />}
    />
  );
}
