# ToDo Maki

Persönliche ToDo-Liste — einfach, intuitiv, mit etwas Finesse.
**Lokal & offline.** Läuft als PWA (kein Build, kein Cloud-Server), installierbar am Mac und am Handy.

## Live (Handy & überall)

**https://marckill78.github.io/todo-maki/** (GitHub Pages, HTTPS).
- **Als App aufs iPhone:** Link in **Safari** öffnen → **Teilen** → **„Zum Home-Bildschirm"** → eigenes Icon, Vollbild, offline.
- Updates: Code pushen → App neu laden (Service Worker aktualisiert sich, ggf. zweimal laden).
- **Daten sind pro Gerät/Adresse** (IndexedDB). Übertragen via ⚙ Einstellungen → Backup exportieren/importieren.

## Lokal entwickeln

Doppelklick auf **`Start-ToDo-Maki.command`** → öffnet die App unter `http://127.0.0.1:8910`.

> Hinweis: localhost und die Live-Adresse sind getrennte Speicher. Daten via Backup-Export/Import umziehen.

## Deployment

Statische Dateien auf GitHub Pages (`marckill78/todo-maki`, Branch `main`, Root). Nach Änderungen: committen + `git push` → Pages baut automatisch. Cache-Version in `index.html` (`?v=N`) und `sw.js` (`maki-vN`) hochzählen.

## Features (Stand: MVP, Iteration 1)

- **Mein Tag** — heute fällige Tasks erscheinen automatisch; überfällige bleiben rot stehen, bis erledigt/verschoben; manuell hinzugefügte bleiben bis erledigt.
- **Bereiche** — Haus, Atelier, Garten, LJBM, Marisca, Projekte (anlegen / bearbeiten / löschen, mit Emoji + Farbe).
- **Tasks** — Titel, Bereich, Fälligkeitsdatum, Priorität (1–5, als farbiges Badge P1–P5 + Button-Auswahl), Symbol (Emoji) + Farbe, Notizen.
- **Unteraufgaben** mit automatischer **Prozent-Anzeige** (Fortschrittsbalken).
- **Wiederholungen** — täglich / wöchentlich / monatlich / jährlich (erzeugt beim Abhaken die nächste Instanz).
- **Anhänge** — Bilder & PDFs (lokal in IndexedDB gespeichert, max. 8 MB).
- **Kalender** — Monats-, Wochen- und Tagesansicht (umschaltbar), mit Tages-Detail.
- **Sortierung** — umschaltbar zwischen **Manuell** (Drag & Drop per Griff ⠿, funktioniert mit Maus & Touch), **Priorität** und **Fälligkeit**. Manuelle Reihenfolge wird gespeichert.
- **Wiederholungs-Intervall** — „alle N Tage/Wochen/Monate/Jahre" pro Aufgabe.
- **Erinnerungen** — optional (⚙️ Einstellungen): Benachrichtigung beim ersten Öffnen pro Tag über heute fällige + überfällige Aufgaben.
- **Dark-Theme** — Hell / Dunkel / System (⚙️ Einstellungen), folgt standardmäßig dem Betriebssystem.
- **Archiv** — erledigte Tasks bleiben den Tag über sichtbar (durchgestrichen) und wandern erst am Folgetag automatisch ins Archiv. Wiederherstellbar.
- **Suche** über Titel, Notizen, Unteraufgaben.
- **🎯 Ziele (Bucketlist)** — langfristige Vorhaben mit Zwischenschritten (Fortschritt), Zieljahr, Kategorie, Bild und „erreicht"-Markierung.
- **📍 Orte** — Reiseziele, Restaurants & Aktivitäten in einer Sektion mit Typ- und Status-Filter. Felder: Name, Typ, Bewertung (Sterne), Preisniveau, Status (will ich / war ich), Website, Telefon (direkt wählbar), Adresse + Google-Maps-Button, Tags, Bild, Notizen.
- **💶 Budget** — Ausgaben mit wählbaren Kategorien (eigener Editor: Emoji, Farbe, **Monatslimit** mit Warnung) und optionalen **Unterkategorien**, Monatsansicht, Donut-Diagramm + Kategorie-Balken, Ausgabenliste.
- **📱 iPhone-tauglich** — kompaktes, responsives Layout (PWA installierbar, Sidebar einklappbar, Karten/Budget für schmale Screens optimiert).
- **Backup** (⚙️ Einstellungen) — kompletter Export als JSON-Datei (inkl. Anhänge, Bilder, Ziele, Orte, Budget) und Wiederherstellung daraus. Wichtig, da die Daten nur lokal im Browser-Profil liegen.

## Technik

- Reines **Vanilla JS + HTML + CSS**, kein Build-Step.
- Daten in **IndexedDB** (`js/db.js`), Geschäftslogik in `js/store.js`, UI in `js/app.js`.
- **Service Worker** (`sw.js`) cacht die App-Shell für Offline-Betrieb. Bei Code-Änderungen Cache-Version (`?v=N` in `index.html` + `maki-vN` in `sw.js`) hochzählen.
- Daten liegen ausschließlich lokal im Browser-Profil. Backup/Export: noch offen (siehe unten).

## Hinweise

- **Sortierung:** Im Modus **Manuell** bestimmt die per Drag & Drop gesetzte Reihenfolge die Liste; alternativ nach **Priorität** oder **Fälligkeit** sortieren (Auswahl oben in jeder Listenansicht, wird gespeichert). Die Drag-Griffe erscheinen nur im Manuell-Modus.
- **Erinnerungen** funktionieren nur beim Öffnen der App (reine PWA ohne Server = keine echten Hintergrund-Pushes). Auf dem iPhone erst nach Installation als App.

## Struktur

```
ToDo_Maki/
├── index.html
├── styles.css
├── manifest.webmanifest
├── sw.js
├── Start-ToDo-Maki.command
├── js/
│   ├── icons.js     # Emoji- & Farbpaletten
│   ├── db.js        # IndexedDB-Schicht
│   ├── store.js     # State & Regeln (Mein Tag, überfällig, Archiv, Wiederholung)
│   └── app.js       # UI-Rendering, Views, Events
└── assets/          # App-Icons
```
