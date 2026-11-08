# Playbook: Shopify-Plugin-Empfehlungen

Stand: 08.11.2026 · Grundlinie: `main` ohne lokale Änderungen.

## Autopilot-Vertrag

- **Fertig, wenn:** Die Shopify-App liefert nach gültiger Admin-Session ausschließlich serverseitig geprüfte, öffentliche Empfehlungen für `shopify`; der Adapter und seine Fehlerfälle sind mit `npm test` und Syntaxprüfung belegt.
- **Abbruch:** Höchstens drei gezielte Korrekturversuche je Blocker. Kein Push, kein Release und kein Live-Deployment.

| ID | Schritt | Erfolgskriterium | Prüfung | Rückfall | Status |
| --- | --- | --- | --- | --- | --- |
| S1 | Festen Feed und Validator implementieren | Keine Shop-/Besucherdaten, keine Weiterleitung, nur erlaubtes Schema | Unit-Tests erfolgreich | Commit zurücksetzen | geprüft |
| S2 | Admin-Route ergänzen | Nur gültige Shopify-Session erhält Ergebnis | Route liegt innerhalb der bestehenden Session-Prüfung; Syntaxprüfung erfolgreich | Commit zurücksetzen | geprüft |
| S3 | Dokumentation und Abschlussprüfung | Datenschutzgrenze und fehlende eingebettete Admin-UI sind klar | `npm run check`, `npm test` und `git diff --check` erfolgreich | Commit zurücksetzen | geprüft |
