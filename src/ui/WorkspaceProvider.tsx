import { useLiveQuery } from "dexie-react-hooks";
import type { ReactNode } from "react";
import { db } from "../data/instance";
import { WorkspaceContext } from "./useWorkspace";

/**
 * Loads all live records once and keeps them current: every committed database
 * change re-runs the query, so all pages always render the stored state.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const workspace = useLiveQuery(() => db.loadWorkspace(), []);
  if (!workspace) return <p className="muted">Lade …</p>;
  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>;
}
