import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "react-router-dom";
import type { Scene } from "../domain/types";
import { displayName } from "./actions";

interface SceneCardProps {
  scene: Scene;
  names: Map<string, string>;
}

/** A sortable scene with its linked characters and locations; opens the scene editor on click. */
export function SceneCard({ scene, names }: SceneCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
    data: { type: "scene" },
  });

  const chips = (ids: string[], kind: string) =>
    ids.flatMap((id) => {
      const name = names.get(id);
      return name ? [<span key={id} className={`chip small ${kind}`}>{name}</span>] : [];
    });

  return (
    <li
      ref={setNodeRef}
      className={`scene-card${isDragging ? " dragging" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <button ref={setActivatorNodeRef} className="handle" aria-label="Szene verschieben" {...attributes} {...listeners}>
        ⠿
      </button>
      <Link to={`../scene/${scene.id}`} className="scene-body">
        <strong>{displayName(scene.title)}</strong>
        {scene.summary && <span className="summary">{scene.summary}</span>}
        <span className="chips">
          {chips(scene.characterIds, "character")}
          {chips(scene.locationIds, "location")}
        </span>
      </Link>
    </li>
  );
}
