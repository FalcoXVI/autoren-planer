import { useState, type FormEvent } from "react";
import type { LinkKind } from "../domain/types";
import { displayName } from "./actions";

interface LinkPickerProps {
  title: string;
  kind: LinkKind;
  options: { id: string; name: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  /** Creates a new entity with the given name and links it. */
  onCreate: (name: string) => void;
  createPlaceholder: string;
}

/** Toggleable chips for linking a scene to characters or locations, plus quick creation. */
export function LinkPicker({ title, kind, options, selectedIds, onToggle, onCreate, createPlaceholder }: LinkPickerProps) {
  const [name, setName] = useState("");

  const create = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
  };

  return (
    <fieldset className="link-picker">
      <legend>{title}</legend>
      <div className="chips">
        {options.length === 0 && <span className="muted">Noch nichts angelegt.</span>}
        {options.map((o) => {
          const selected = selectedIds.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              className={`chip ${kind}${selected ? " selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onToggle(o.id)}
            >
              {selected ? "✓ " : ""}
              {displayName(o.name)}
            </button>
          );
        })}
      </div>
      <form className="inline-form" onSubmit={create}>
        <input aria-label={createPlaceholder} placeholder={createPlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit">Anlegen &amp; verknüpfen</button>
      </form>
    </fieldset>
  );
}
