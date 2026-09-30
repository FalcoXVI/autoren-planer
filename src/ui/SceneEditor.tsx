import { Link, useNavigate, useParams } from "react-router-dom";
import { repository } from "../data/instance";
import { chaptersOf, charactersInBook, defaultOwner, locationsInBook, scenesOf } from "../domain/scope";
import type { LinkKind, Scene, Workspace } from "../domain/types";
import { confirmAndDelete, displayName, reportError } from "./actions";
import { Field } from "./Field";
import { LinkPicker } from "./LinkPicker";
import { useCurrentBook } from "./useCurrentBook";
import { useWorkspace } from "./useWorkspace";

/**
 * Options for a scene's link picker: everything visible in the book plus
 * entities already linked but out of scope (e.g. after the book left its series),
 * so existing links stay visible and removable.
 */
function linkOptions(ws: Workspace, scene: Scene, kind: LinkKind, inScope: { id: string; name: string }[]) {
  const all = kind === "character" ? ws.characters : ws.locations;
  const linked = kind === "character" ? scene.characterIds : scene.locationIds;
  const extra = all.filter((e) => linked.includes(e.id) && !inScope.some((o) => o.id === e.id));
  return [...inScope, ...extra];
}

/** Edits one scene: text, chapter and links to characters and locations. */
export function SceneEditor() {
  const { sceneId } = useParams();
  const book = useCurrentBook();
  const ws = useWorkspace();
  const navigate = useNavigate();
  const scene = ws.scenes.find((s) => s.id === sceneId && s.bookId === book.id);

  if (!scene) {
    return (
      <p>
        Diese Szene gibt es nicht (mehr). <Link to="../plot">Zum Plot</Link>
      </p>
    );
  }

  const toggle = (kind: LinkKind) => (id: string) => repository.toggleSceneLink(scene.id, kind, id).catch(reportError);

  const createAndLink = async (kind: LinkKind, name: string) => {
    try {
      const entity =
        kind === "character"
          ? await repository.createCharacter(defaultOwner(book), name)
          : await repository.createLocation(defaultOwner(book), name);
      await repository.toggleSceneLink(scene.id, kind, entity.id);
    } catch (error) {
      reportError(error);
    }
  };

  const changeChapter = (chapterId: string) =>
    repository.moveScene(scene.id, chapterId, scenesOf(ws, chapterId).length).catch(reportError);

  const remove = async () => {
    if (await confirmAndDelete({ collection: "scenes", id: scene.id }, `Szene „${displayName(scene.title)}" löschen?`)) {
      navigate("../plot");
    }
  };

  return (
    <div className="editor" key={scene.id}>
      <Link to="../plot" className="back">
        ← Zum Plot
      </Link>
      <section className="card">
        <Field label="Titel der Szene" value={scene.title} onCommit={(title) => repository.update("scenes", scene.id, { title }).catch(reportError)} />
        <div className="field">
          <label htmlFor="scene-chapter">Kapitel</label>
          <select id="scene-chapter" value={scene.chapterId} onChange={(e) => changeChapter(e.target.value)}>
            {chaptersOf(ws, book.id).map((c, i) => (
              <option key={c.id} value={c.id}>
                {i + 1}. {displayName(c.title)}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Was passiert?"
          multiline
          value={scene.summary}
          onCommit={(summary) => repository.update("scenes", scene.id, { summary }).catch(reportError)}
        />
      </section>

      <section className="card">
        <LinkPicker
          title="Figuren in dieser Szene"
          kind="character"
          options={linkOptions(ws, scene, "character", charactersInBook(ws, book))}
          selectedIds={scene.characterIds}
          onToggle={toggle("character")}
          onCreate={(name) => createAndLink("character", name)}
          createPlaceholder="Neue Figur"
        />
        <LinkPicker
          title="Orte dieser Szene"
          kind="location"
          options={linkOptions(ws, scene, "location", locationsInBook(ws, book))}
          selectedIds={scene.locationIds}
          onToggle={toggle("location")}
          onCreate={(name) => createAndLink("location", name)}
          createPlaceholder="Neuer Ort"
        />
      </section>

      <div className="actions">
        <button className="danger" onClick={remove}>
          Szene löschen
        </button>
      </div>
    </div>
  );
}
