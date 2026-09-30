import { useEffect, useId, useRef, useState } from "react";

interface FieldProps {
  label: string;
  value: string;
  /** Called with the new text after a short typing pause and on blur. */
  onCommit: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  /** Hides the label visually but keeps it for screen readers. */
  hideLabel?: boolean;
}

const COMMIT_DELAY_MS = 400;

/**
 * Text input that saves automatically. It keeps its own draft while the user
 * types, so asynchronous database updates never move the cursor or swallow
 * keystrokes. External changes are adopted while the field is not focused.
 */
export function Field({ label, value, onCommit, multiline = false, placeholder, hideLabel = false }: FieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Latest values for the unmount flush, which must not depend on stale closures.
  const latest = useRef({ draft, value, onCommit });
  latest.current = { draft, value, onCommit };

  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  const commit = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    const { draft: d, value: v, onCommit: save } = latest.current;
    if (d !== v) save(d);
  };

  // Save pending input when the editor closes, e.g. on navigation.
  useEffect(
    () => () => {
      if (timer.current !== undefined) commit();
    },
    [],
  );

  const props = {
    id,
    value: draft,
    placeholder,
    onFocus: () => {
      focused.current = true;
    },
    onBlur: () => {
      focused.current = false;
      commit();
    },
    onChange: (e: { target: { value: string } }) => {
      setDraft(e.target.value);
      clearTimeout(timer.current);
      timer.current = setTimeout(commit, COMMIT_DELAY_MS);
    },
  };

  return (
    <div className="field">
      <label htmlFor={id} className={hideLabel ? "visually-hidden" : undefined}>
        {label}
      </label>
      {multiline ? <textarea rows={4} {...props} /> : <input type="text" {...props} />}
    </div>
  );
}
