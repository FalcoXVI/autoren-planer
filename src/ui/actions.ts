import { repository } from "../data/instance";
import { DeletionBlockedError, type DeletionTarget } from "../domain/deletion";

/** Shows a failed operation to the user instead of failing silently. */
export function reportError(error: unknown): void {
  console.error(error);
  alert(`Das hat leider nicht geklappt:\n${error instanceof Error ? error.message : String(error)}`);
}

/**
 * Asks for confirmation and deletes the target with its dependents.
 *
 * @returns true if the deletion happened.
 */
export async function confirmAndDelete(target: DeletionTarget, question: string): Promise<boolean> {
  if (!confirm(question)) return false;
  try {
    await repository.delete(target);
    return true;
  } catch (error) {
    if (error instanceof DeletionBlockedError) {
      alert("Die Reihe enthält noch Bücher. Nimm die Bücher zuerst aus der Reihe oder lösche sie.");
    } else {
      reportError(error);
    }
    return false;
  }
}

/** Placeholder text for records the author has not named yet. */
export function displayName(name: string): string {
  return name.trim() || "(ohne Titel)";
}
