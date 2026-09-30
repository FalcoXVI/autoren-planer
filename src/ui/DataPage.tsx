import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { backupService } from "../data/instance";
import { BackupFormatError } from "../domain/backup";
import { reportError } from "./actions";
import { useWorkspace } from "./useWorkspace";

/** Triggers a browser download of the given text. */
function download(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Revoking right away can cancel the download in some mobile browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Backup export/import and the storage status of the device. */
export function DataPage() {
  const ws = useWorkspace();
  const fileInput = useRef<HTMLInputElement>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null));
  }, []);

  const exportData = async () => {
    try {
      const date = new Date().toISOString().slice(0, 10);
      download(`autoren-planer-backup-${date}.json`, await backupService.exportJson());
      setMessage("Backup wurde heruntergeladen.");
    } catch (error) {
      reportError(error);
    }
  };

  const importData = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm(`„${file.name}" einspielen? Alle aktuellen Daten auf diesem Gerät werden dadurch ersetzt.`)) return;
    try {
      await backupService.importJson(await file.text());
      setMessage("Backup wurde eingespielt.");
    } catch (error) {
      if (error instanceof BackupFormatError) {
        alert(`Die Datei ist kein gültiges Backup. Deine Daten sind unverändert.\n\n${error.message}`);
      } else {
        reportError(error);
      }
    }
  };

  const requestPersistence = async () => {
    setPersisted((await navigator.storage?.persist?.()) ?? false);
  };

  return (
    <div className="page">
      <h1>Deine Daten</h1>
      <section className="card">
        <p>
          Alles wird auf diesem Gerät gespeichert und funktioniert auch offline: {ws.books.length} Bücher,{" "}
          {ws.characters.length} Figuren, {ws.locations.length} Orte, {ws.scenes.length} Szenen.
        </p>
        <p>
          Dauerhafter Speicher:{" "}
          {persisted === null ? (
            "unbekannt"
          ) : persisted ? (
            <strong>aktiv</strong>
          ) : (
            <>
              <strong>nicht aktiv</strong> – der Browser darf die Daten bei Speichermangel löschen.{" "}
              <button onClick={requestPersistence}>Anfragen</button>
            </>
          )}
        </p>
      </section>
      <section className="card">
        <h2>Backup</h2>
        <p className="hint">
          Das Backup ist eine lesbare JSON-Datei mit allen Daten. Sichere sie regelmäßig, z. B. in deinem Cloud-Ordner.
        </p>
        <div className="actions">
          <button className="primary" onClick={exportData}>
            Backup herunterladen
          </button>
          <button onClick={() => fileInput.current?.click()}>Backup einspielen …</button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importData} />
        </div>
        {message && <p className="success">{message}</p>}
      </section>
    </div>
  );
}
