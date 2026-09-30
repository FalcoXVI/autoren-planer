import { createBackup, parseBackup, serializeBackup } from "../domain/backup";
import { COLLECTIONS } from "../domain/types";
import type { PlannerDatabase } from "./PlannerDatabase";

/** Exports all live data as a JSON backup and restores it again. */
export class BackupService {
  constructor(
    private readonly db: PlannerDatabase,
    private readonly clock: () => number = Date.now,
  ) {}

  async exportJson(): Promise<string> {
    const ws = await this.db.loadWorkspace();
    return serializeBackup(createBackup(ws, new Date(this.clock())));
  }

  /**
   * Replaces the current data with the backup. The file is fully validated
   * before anything is written, so an invalid file never destroys data.
   * Existing records become tombstones instead of vanishing, and imported
   * records get a fresh timestamp; a later sync therefore propagates the restore.
   *
   * @throws BackupFormatError if the file is invalid.
   */
  async importJson(json: string): Promise<void> {
    const ws = parseBackup(json);
    const now = this.clock();
    await this.db.transaction("rw", this.db.allTables(), async () => {
      for (const collection of COLLECTIONS) {
        const table = this.db.tableOf(collection);
        await table.toCollection().modify({ deleted: true, updatedAt: now });
        await table.bulkPut(ws[collection].map((r) => ({ ...r, deleted: false, updatedAt: now })));
      }
    });
  }
}
