# Playbook: Shopify-Plugin-Empfehlungen

Stand: 08.11.2026 · Grundlinie: `main` ohne lokale Änderungen.

## Autopilot-Vertrag

- **Fertig, wenn:** Die Shopify-App liefert nach gültiger Admin-Session ausschließlich serverseitig geprüfte, öffentliche Empfehlungen für `shopify` und stellt sie als lokale, eingebettete Karten dar; der Adapter, die Fehlerfälle und die Browser-Datengrenze sind mit `npm test` und Syntaxprüfung belegt.
- **Abbruch:** Höchstens drei gezielte Korrekturversuche je Blocker. Kein Push, kein Release und kein Live-Deployment.

| ID | Schritt | Erfolgskriterium | Prüfung | Rückfall | Status |
| --- | --- | --- | --- | --- | --- |
| S1 | Festen Feed und Validator implementieren | Keine Shop-/Besucherdaten, keine Weiterleitung, nur erlaubtes Schema | Unit-Tests erfolgreich | Commit zurücksetzen | geprüft |
| S2 | Admin-Route ergänzen | Nur gültige Shopify-Session erhält Ergebnis | Route liegt innerhalb der bestehenden Session-Prüfung; Syntaxprüfung erfolgreich | Commit zurücksetzen | geprüft |
| S3 | Dokumentation und Abschlussprüfung | Datenschutzgrenze und fehlende eingebettete Admin-UI sind klar | `npm run check`, `npm test` und `git diff --check` erfolgreich | Commit zurücksetzen | geprüft |
| S4 | Admin-Grenze als HTTP-Handler testbar machen | Ungültige Session bekommt 401, gültige Session nur öffentliche Empfehlungen | Handler-Test, Syntax- und vollständige Unit-Prüfung erfolgreich | Commit zurücksetzen | geprüft |
| S5 | Eingebettete Empfehlungsansicht ergänzen | Lokale Kartenansicht nutzt nur `/admin/recommendations` mit Shopify-ID-Token | Unit-Tests für Seite, CSP und lokalen API-Abruf; Syntaxprüfung | Commit zurücksetzen | geprüft |
