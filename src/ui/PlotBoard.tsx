import {
  closestCenter,
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { repository } from "../data/instance";
import { chaptersOf } from "../domain/scope";
import { displayName, reportError } from "./actions";
import {
  buildLayout,
  chapterOfScene,
  moveChapterTo,
  moveSceneAcross,
  moveSceneWithin,
  sameLayout,
  type BoardLayout,
} from "./boardLayout";
import { ChapterSection } from "./ChapterSection";
import { useCurrentBook } from "./useCurrentBook";
import { useWorkspace } from "./useWorkspace";

type DragKind = "chapter" | "scene";
const kindOf = (item: { data: { current?: Record<string, unknown> | undefined } } | null) =>
  item?.data.current?.type as DragKind | undefined;

/**
 * Chapters dragged only collide with chapters. Scenes prefer the scene under
 * the pointer, then the chapter under the pointer (to drop into empty
 * chapters); keyboard dragging has no pointer and falls back to corners.
 */
const collisionDetection: CollisionDetection = (args) => {
  if (kindOf(args.active) === "chapter") {
    return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => kindOf(c) === "chapter") });
  }
  const scenes = args.droppableContainers.filter((c) => kindOf(c) === "scene");
  const chapters = args.droppableContainers.filter((c) => kindOf(c) === "chapter");
  const overScene = pointerWithin({ ...args, droppableContainers: scenes });
  if (overScene.length > 0) return overScene;
  const overChapter = pointerWithin({ ...args, droppableContainers: chapters });
  return overChapter.length > 0 ? overChapter : closestCorners(args);
};

/** The book's chapters and scenes, reorderable by drag & drop (also across chapters). */
export function PlotBoard() {
  const book = useCurrentBook();
  const ws = useWorkspace();
  const navigate = useNavigate();

  const chapters = useMemo(() => chaptersOf(ws, book.id), [ws, book.id]);
  const persisted = useMemo(() => buildLayout(chapters, ws.scenes), [chapters, ws.scenes]);
  const [draft, setDraft] = useState<BoardLayout | null>(null);
  const [active, setActive] = useState<{ kind: DragKind; id: string } | null>(null);
  const layout = draft ?? persisted;

  // Once the database reflects the drop, the draft is no longer needed.
  useEffect(() => setDraft(null), [persisted]);

  const chapterById = useMemo(() => new Map(chapters.map((c) => [c.id, c])), [chapters]);
  const sceneById = useMemo(() => new Map(ws.scenes.map((s) => [s.id, s])), [ws.scenes]);
  const names = useMemo(
    () => new Map([...ws.characters, ...ws.locations].map((e) => [e.id, displayName(e.name)])),
    [ws.characters, ws.locations],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    const kind = kindOf(active);
    if (kind) setActive({ kind, id: String(active.id) });
  };

  // Scenes change their chapter while hovering, so the target chapter opens a gap.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || kindOf(active) !== "scene") return;
    const sceneId = String(active.id);
    const overId = String(over.id);
    const current = draft ?? persisted;
    const toChapter = kindOf(over) === "chapter" ? overId : chapterOfScene(current, overId);
    if (!toChapter || toChapter === chapterOfScene(current, sceneId)) return;
    setDraft(moveSceneAcross(current, sceneId, toChapter, kindOf(over) === "scene" ? overId : undefined));
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActive(null);
    const current = draft ?? persisted;
    const id = String(active.id);
    if (!over) return setDraft(null);

    if (kindOf(active) === "chapter") {
      const next = moveChapterTo(current, id, String(over.id));
      return commit(next, () => repository.moveChapter(id, next.chapterIds.indexOf(id)));
    }
    const chapterId = chapterOfScene(current, id);
    if (!chapterId) return setDraft(null);
    const next = kindOf(over) === "scene" ? moveSceneWithin(current, id, String(over.id)) : current;
    commit(next, () => repository.moveScene(id, chapterId, next.scenesByChapter[chapterId]!.indexOf(id)));
  };

  /** Keeps the dropped layout visible until the database write shows up in the live query. */
  const commit = (next: BoardLayout, write: () => Promise<void>) => {
    if (sameLayout(next, persisted)) return setDraft(null);
    setDraft(next);
    write().catch((error) => {
      setDraft(null);
      reportError(error);
    });
  };

  const addChapter = () =>
    repository.createChapter(book.id, `Kapitel ${chapters.length + 1}`).catch(reportError);

  const addScene = async (chapterId: string) => {
    try {
      const scene = await repository.createScene(chapterId, "Neue Szene");
      navigate(`../scene/${scene.id}`);
    } catch (error) {
      reportError(error);
    }
  };

  const activeLabel =
    active &&
    displayName((active.kind === "chapter" ? chapterById.get(active.id)?.title : sceneById.get(active.id)?.title) ?? "");

  return (
    <div className="plot-board">
      <p className="hint">Ziehe Kapitel und Szenen am Griff ⠿, um sie umzusortieren – auch zwischen Kapiteln.</p>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setActive(null);
          setDraft(null);
        }}
      >
        <SortableContext items={layout.chapterIds} strategy={verticalListSortingStrategy}>
          {layout.chapterIds.map((chapterId, index) => {
            const chapter = chapterById.get(chapterId);
            if (!chapter) return null;
            const scenes = (layout.scenesByChapter[chapterId] ?? []).flatMap((id) => sceneById.get(id) ?? []);
            return (
              <ChapterSection
                key={chapterId}
                chapter={chapter}
                number={index + 1}
                scenes={scenes}
                names={names}
                onAddScene={() => addScene(chapterId)}
              />
            );
          })}
        </SortableContext>
        <DragOverlay>
          {active && <div className={`drag-overlay ${active.kind}`}>{activeLabel}</div>}
        </DragOverlay>
      </DndContext>
      <button className="add-chapter" onClick={addChapter}>
        + Kapitel
      </button>
    </div>
  );
}
