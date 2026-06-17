#!/bin/bash
# ToDo Maki starten — lokaler Server + Browser öffnen.
# Doppelklick im Finder genügt.
cd "$(dirname "$0")" || exit 1
PORT=8910
# Falls schon ein Server läuft, einfach Browser öffnen
if ! lsof -i :$PORT >/dev/null 2>&1; then
  python3 -m http.server $PORT >/dev/null 2>&1 &
  sleep 1
fi
open "http://127.0.0.1:$PORT/index.html"
echo "ToDo Maki läuft auf http://127.0.0.1:$PORT  (Fenster zum Beenden schließen)"
# Server im Vordergrund halten, damit das Terminal-Fenster ihn am Leben hält
wait
