# Änderungen

## 0.2.0 (Entwurf, Pre-Alpha)

Das Theme kommt jetzt komplett aus dem Generator der Plattform. Es enthält alle Funktionen, die dort seit 0.1.0 dazugekommen sind.

- Neu: Startseiten-Bereiche (Vorteile, Kategorie-Kacheln, Bild mit Text, Text, FAQ, Kundenstimmen, Newsletter, Video mit 2-Klick-Schutz) und verwandte Artikel auf der Artikelseite.
- Neu: Recht: Hinweis zur Gewährleistung, Produktsicherheit (GPSR) über Metafelder, Lieferzeit, niedrigster Preis der letzten 30 Tage über ein Metafeld, Link zum Widerruf und zur Barrierefreiheitserklärung im Footer.
- Neu: SEO: strukturierte Daten (JSON-LD), Brotkrümelnavigation, Standardbild für soziale Netzwerke.
- Neu: Farbvorlage "Basis" mit eigenen Farben für Hell und Dunkel, Touch-Icon, Logohöhe auf dem Handy, Kartenstil, Ausverkauft-Anzeige, Vertrauens-Hinweise, Newsletter und Versandarten im Footer.
- Neu: Die Notification-Glocke sitzt jetzt richtig in der Kopfzeile (neben dem Warenkorb) und ist wählbar: Aus, Kopfzeile, Footer oder schwebend. Sie ist ein Button mit Beschriftung, Tastaturbedienung (Escape schließt) und erscheint nur, wenn ein Platz gewählt ist und die App antwortet.
- Geändert: Die Glocke ist beim Start aus (vorher im Hauptmenü). Die Einstellungen heißen jetzt `mt_notification_placement` und `mt_notification_proxy_path` (vorher `mgd_notification_*`). Wer 0.1.0 benutzt hat, wählt den Platz einmal neu.
- Geändert: Die Dateien der Glocke heißen jetzt `mt-notification.*` (vorher `mgd-notification-center.*`).
- Neu: `LICENSE` mit den Lizenz-Hinweisen und eine einfache Erklärung in der README. Die Lizenzfrage wird noch rechtlich geprüft.
- Neu: Theme Check von Shopify läuft offline bei jedem Pull Request (`scripts/theme-check.mjs`). Ergebnis für 0.2.0: keine Fehler, keine Warnungen.
- App: unverändert, nur die Versionsnummer folgt dem Release (0.2.0). Schnittstelle (API-Version 1) bleibt gleich.
- Bekannt offen: nicht im Theme Store, nicht in einem echten Shop oder Entwicklungs-Shop getestet, App ohne Oberfläche und ohne Installationsablauf.

## 0.1.0 (Entwurf, Pre-Alpha)

Erstes vollständiges Theme.

- Neu: komplettes Shopify-Theme (Online Store 2.0) mit Layout, Bereichen, Vorlagen, Snippets und Übersetzungen (Deutsch und Englisch).
- Neu: Hell- und Dunkelmodus, Einstellungen für Farben, Schriften, Form, Logo, Kopf- und Fußzeile, Startseite, Listing, Artikelseite, Recht, Barrierefreiheit und Geschwindigkeit.
- Neu: neun lokale Schriftfamilien (SIL Open Font License 1.1), keine externen Ressourcen.
- Neu: Notification-Glocke ist im Theme eingebunden. Platzierung und App-Proxy-Pfad stehen in den Theme-Einstellungen.
- Neu: Notification-App `michatheme-v5-app/` (Entwurf, siehe README).
- Neu: Prüfskript `scripts/check-release.mjs`, Bauskript `scripts/build-release.sh` und eine Prüfung bei jedem Pull Request.
- Bekannt offen: nicht im Theme Store, nicht in einem echten Shop getestet, App ohne Oberfläche und ohne Installationsablauf.
