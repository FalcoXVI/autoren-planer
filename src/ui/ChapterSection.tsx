import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { repository } from "../data/instance";
import type { Chapter, Scene } from "../domain/types";
import { confirmAndDelete, displayName, reportError } from "./actions";
import { Field } from "./Field";
import { SceneCard } from "./SceneCard";

interface ChapterSectionProps {
  chapter: Chapter;
  /** One-based number shown in front of the title. */
  number: number;
  scenes: Scene[];
  /** Display names of characters and locations by id, for the scene chips. */
  names: Map<string, string>;
  onAddScene: () => void;
}

/** A sortable chapter on the plot board containing its sortable scenes. */
export function ChapterSection({ chapter, number, scenes, names, onAddScene }: ChapterSectionProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
    data: { type: "chapter" },
  });

  const remove = () =>
    confirmAndDelete(
      { collection: "chapters", id: chapter.id },
      `Kapitel „${displayName(chapter.title)}" mit ${scenes.length} Szene(n) löschen?`,
    );

  return (
    <section
      ref={setNodeRef}
      className={`chapter card${isDragging ? " dragging" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div className="chapter-head">
        <button ref={setActivatorNodeRef} className="handle" aria-label="Kapitel verschieben" {...attributes} {...listeners}>
          ⠿
        </button>
        <span className="chapter-number">{number}.</span>
        <Field
          label="Kapiteltitel"
          hideLabel
          value={chapter.title}
          onCommit={(title) => repository.update("chapters", chapter.id, { title }).catch(reportError)}
        />
        <button className="danger subtle" onClick={remove} aria-label="Kapitel löschen" title="Kapitel löschen">
          ✕
        </button>
      </div>
      <SortableContext items={scenes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ol className="scene-list">
          {scenes.map((scene) => (
            <SceneCard key={scene.id} scene={scene} names={names} />
          ))}
          {scenes.length === 0 && <li className="empty-drop muted">Szenen hierher ziehen oder neu anlegen</li>}
        </ol>
      </SortableContext>
      <button className="subtle" onClick={onAddScene}>
        + Szene
      </button>
    </section>
  );
}
