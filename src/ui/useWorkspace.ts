import { createContext, useContext } from "react";
import type { Workspace } from "../domain/types";

export const WorkspaceContext = createContext<Workspace | null>(null);

/** The current live workspace; only usable below `WorkspaceProvider`. */
export function useWorkspace(): Workspace {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return workspace;
}
