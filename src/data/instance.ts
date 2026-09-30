import { BackupService } from "./BackupService";
import { PlannerDatabase } from "./PlannerDatabase";
import { PlannerRepository } from "./PlannerRepository";

/** The app-wide database and services; tests create their own instances instead. */
export const db = new PlannerDatabase();
export const repository = new PlannerRepository(db);
export const backupService = new BackupService(db);
