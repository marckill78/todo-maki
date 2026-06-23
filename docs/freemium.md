# ToDo Maki — Freemium-Konzept

Status: **Vorbereitung umgesetzt** (Code-Weiche steht, Bezahlung folgt). Stand: v31.

## Leitprinzip

> **Gratis = was keine Serverkosten verursacht** (alles lokal auf dem Gerät).
> **Bezahlt = was Cloud kostet** (Geräte-Sync, Cloud-Backup, Foto-Speicher).

So zahlt nur, wer die teure Funktion wirklich nutzt — und genau die rechtfertigt das Abo. Gratis-Nutzer werden nie subventioniert.

## Funktions-Schnitt

| Funktion | Maki (gratis) | Maki Plus (Abo) |
|---|---|---|
| Alle 7 Module (Aufgaben, Ziele, Orte, Budget, Anschaffungen, Kalender, Statistik) — unbegrenzt | ✅ | ✅ |
| Offline, Dark-Mode, Erinnerungen, Vorlagen, Tags, Drag&Drop | ✅ | ✅ |
| Daten-Export (JSON/CSV) | ✅ | ✅ |
| Nutzung ohne Account | ✅ | – |
| 📲 Geräte-Sync (iPhone + iPad + Mac) | – | ✅ |
| ☁️ Automatisches Cloud-Backup | – | ✅ |
| 🖼️ Foto-Sync (Bilder zu Orten/Zielen/Anschaffungen) | – | ✅ |
| 📊 Erweiterte Statistik / Verläufe (geplant) | – | ✅ |

**Bewusst immer gratis:** lokale Nutzung **und** Datenexport. Bei einer App mit persönlichen Daten ist Vertrauen alles — Nutzer dürfen sich nie als Geisel ihrer eigenen Daten fühlen.

## Preise (Richtwerte, DE-Markt)

- **1,99 €/Monat** oder **14,99 €/Jahr** (Jahr ~37 % günstiger → schiebt ins Jahresabo)
- **7 Tage gratis testen** (Apple unterstützt das nativ)
- Optional **Lifetime einmalig ~24,99 €** — nur mit Speicherlimit, da laufende Serverkosten pro Lifetime-Nutzer dauerhaft anfallen.

## Technische Umsetzung

### Schon umgesetzt (v31, „freemium-ready")
- **Login ist optional.** Das frühere Pflicht-Login-Gate auf der Live-Domain ist entfernt; die App ist ohne Konto voll lokal nutzbar. Anmeldung läuft über die Einstellungen.
- **Eine zentrale Weiche:** `isPlus()` / `setPlus()` in `js/app.js`. Beim Start: `Sync.setEntitled(isPlus())`.
- **`js/sync.js`** hat ein `entitled`-Flag: `isOn() = !!user && entitled`. Damit hängen **automatisch** alle Cloud-Pfade an Plus:
  - `pushDoc` / `pushDelete` (Schreiben nach Firestore) → no-op ohne Plus
  - `canUpload` / `uploadImage` (Foto-Sync) → Fallback auf lokalen Blob
  - `onLogin` (Pull + Listener) → wird ohne Plus übersprungen, App bleibt rein lokal (auch bei gespeicherter Google-Sitzung)
- **Testschalter** in Einstellungen → „Maki Plus aktiviert" (lädt beim Umschalten neu). Default: **an**, damit bestehende Nutzung unverändert läuft.

### Noch offen (für echten Verkauf)
1. **Native Hülle** (Capacitor) — die reine PWA kann kein Apple-IAP.
2. **StoreKit / In-App-Purchase** für das Abo (Apple verlangt das; Stripe/PayPal in der App verboten, Apple nimmt 15–30 %).
3. **RevenueCat** (kostenlos bis ~2.500 $/Mon. Umsatz) verwaltet Abo-Status/Trial/Restore und liefert einen `isPlus`-Check.
4. `isPlus()` von localStorage auf den RevenueCat-Entitlement-Status umstellen. **Default kippt dann auf „aus" bis gekauft.**
5. Firebase **Spark → Blaze** (Pay-as-you-go), Storage-Limits/Quotas setzen.
6. Pflicht-Beiwerk: Privacy Policy, Support-Adresse, DSGVO-Hinweise (Firebase = USA), Paywall-Texte.

## Realistische Erwartung

Freemium-Konversion liegt typisch bei **1–3 %**. 1.000 aktive Nutzer → ~20 Zahler → grob 20–35 €/Monat vor Apples Anteil. Der Hebel ist **Reichweite/Vertrieb**, nicht das Modell. Das Konzept ist sauber — es verdient erst, wenn oben im Trichter Nutzer reinkommen.

## Empfohlene Reihenfolge

1. (✅) Code freemium-ready machen — erledigt.
2. Kostenlos/als PWA veröffentlichen, **echte Nutzer + Feedback** sammeln.
3. Spitze **Nische** bespielen (z. B. Heimwerker/Garten/Sammler — passt zu Lego/Atelier).
4. Erst bei echter Nachfrage nach Sync → **Weg 2** (Capacitor + RevenueCat) und Abo scharf schalten.
