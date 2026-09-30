# Autoren-Planer

Planungs-App für Romanautoren: Bücher und Reihen, Figuren, Orte und der Plot
(Kapitel und Szenen) – alles miteinander verknüpft. Läuft als installierbare
Web-App (PWA) am Desktop und am Handy, offline-fähig.

## Starten

```powershell
cd $env:USERPROFILE\Desktop\autoren-planer
npm install
npm run dev        # Entwicklungsserver: http://localhost:5173
```

Produktions-Build lokal ansehen (mit Service Worker, also offline-fähig):

```powershell
npm run build
npm run preview    # http://localhost:4173
```

## Testen

```powershell
npm test           # Unit-Tests der Kernlogik (Vitest)
npm run typecheck  # TypeScript-Prüfung
```

### Am Android-Handy testen (im selben WLAN)

`npm run dev` zeigt neben `localhost` auch eine `Network`-Adresse
(z. B. `http://192.168.1.20:5173`). Die im Chrome am Handy öffnen.
Windows-Firewall-Abfrage für Node beim ersten Start mit „Privates Netzwerk" erlauben.

Über das WLAN läuft die Seite ohne HTTPS; die App funktioniert, ist aber erst
installierbar und offline-fähig, sobald sie über HTTPS kommt (GitHub Pages, s. u.).

## Installieren als App

- **Desktop (Chrome/Edge):** Seite öffnen → Installieren-Symbol in der Adressleiste.
- **Android (Chrome):** Seite öffnen → Menü ⋮ → „App installieren".

## Deployment auf GitHub Pages

Der Workflow `.github/workflows/deploy.yml` baut und veröffentlicht die App bei
jedem Push auf `main`. Einmalig im Repository unter *Settings → Pages → Source*
„GitHub Actions" wählen.

## Daten

- Gespeichert wird lokal im Browser (IndexedDB). Die App fordert dauerhaften
  Speicher an, damit der Browser die Daten nicht wegräumt.
- **Daten → Backup herunterladen** erzeugt eine lesbare JSON-Datei mit allem.
  **Backup einspielen** ersetzt den Datenstand des Geräts; ungültige Dateien
  werden vorher abgelehnt, ohne etwas zu verändern.
- Gelöschtes bleibt intern als „Grabstein" erhalten – Grundlage für den
  späteren Sync zwischen Geräten.

## Aufbau

```
src/domain/  Reine Kernlogik ohne UI/DB (Typen, Sichtbarkeit, Verknüpfungen,
             Sortierung, Lösch-Kaskaden, Backup-Format) – vollständig getestet
src/data/    IndexedDB (Dexie), Repository für alle Schreibvorgänge, Backup
src/ui/      React-Komponenten; Plot-Board mit dnd-kit
```

Figuren und Orte gehören entweder einem Buch oder einer ganzen Reihe; Reihen-
Einträge stehen in allen Büchern der Reihe zur Verfügung.

## Hinweis Windows

`package.json` ersetzt Rollup durch `@rollup/wasm-node`, weil Windows (Smart App
Control) die native Rollup-Datei blockiert, die der PWA-Build braucht.
