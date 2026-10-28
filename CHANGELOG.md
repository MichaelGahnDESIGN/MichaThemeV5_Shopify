# Änderungen

## 0.4.1 (Entwurf, Pre-Alpha)

Kleine Korrektur zu 0.4.0.

- Korrigiert: Der Zähl-Text der Favoriten stimmt jetzt in der Einzahl. Deutsch: „Favoriten, 1 Eintrag“ (vorher „1 Einträge“). Englisch: „Favorites, 1 item“. Dafür gibt es die neue Übersetzung `general.fav_count_one`.
- Doku: Hinweis zu Farben und Palette. Gespeicherte Farbpaletten gibt es bei Shopify nicht (siehe README).

## 0.4.0 (Entwurf, Pre-Alpha)

Neue Icon-Leiste in der Kopfzeile. Sie gilt gleich für die vier MichaThemeV5-Themes.

- Neu: Reihenfolge rechts in der Kopfzeile: Hell/Dunkel-Schalter, Glocke, Favoriten, Konto, Warenkorb. Die Suche bleibt in der Mitte.
- Geändert: Der Hell/Dunkel-Schalter ist nur noch ein Symbol (44 × 44 Pixel). Der Zustand steht im Tooltip und für Screenreader im Label.
- Neu: Einstellung „Ort des Hell/Dunkel-Schalters“: Header oder Footer (Zeile im Footer).
- Einschränkung: „Benutzerkonto-Einstellungen“ gibt es bei Shopify nicht richtig. Das Kundenkonto gehört Shopify, das Theme kann dort nichts einfügen. Bei dieser Wahl steht der Schalter als Zeile im Footer.
- Neu: Favoriten (Herz) auf Produktkarten und der Artikelseite. Das Symbol im Header erscheint erst, wenn mindestens ein Favorit gemerkt ist. Die Liste bleibt im Browser des Besuchers. Mit der Einstellung „Favoriten“ abschaltbar.
- Einschränkung: Keine Merkliste, denn Shopify hat keine eigene Wunschliste.
- Geändert: Die Glocke bleibt unsichtbar, solange die App keine Meldung liefert (vorher auch bei leerer Antwort sichtbar).
- Geändert: Hell/Dunkel, Textgröße und Favoriten kommen aus einer gemeinsamen Datei (`mt-theme.js`). Der doppelte Code in `mt-shopify.js` ist weg.
- Geprüft: offizielles Theme Check (keine Fehler, keine Warnungen), Tests der Plattform, Sichtprüfung aus einer statischen Vorschau mit Beispieldaten (Hell und Dunkel, 1280 und 390 Pixel).
- Bekannt offen: nicht im Theme Store, nicht in einem echten Shop getestet, App ohne Oberfläche.

## 0.3.1 (Entwurf, Pre-Alpha)

Kleine Korrektur zum neuen Design.

- Geändert: Der Text der Ankündigungsleiste ist standardmäßig leer (kein erfundener Beispieltext).
- Geändert: Links ändern beim Darüberfahren die Farbe aus dem Akzent-Linkton (`accent-text`) und sind so auch bei eigenen Akzentfarben gut lesbar.
- Der Standard-Akzent, die Farben und alle Einstellungen bleiben wie in 0.3.0. Prozent-Siegel und Countdown gibt es nur in den Pro-Erweiterungen und sind dort jetzt aus.
- Bekannt offen: nicht im Theme Store, nicht in einem echten Shop getestet, App ohne Oberfläche.

## 0.3.0 (Entwurf, Pre-Alpha)

Neues, einheitliches Design. Es gilt gleich für die vier MichaThemeV5-Themes (WooCommerce, Shopware, JTL-Shop, Shopify).

- Geändert: Hell = weiße Karten auf Hellgrau, Dunkel = Anthrazit. Standard-Akzent ist jetzt Rot, jeder andere Akzent und die eigene Farbe bleiben wählbar. Wer schon einen Akzent gespeichert hat, behält ihn.
- Geändert: Rot nur für Bedienbares (Kaufen-Button, aktiver Menüpunkt, aktuelle Seite, Warenkorb-Zähler). Pro Seite gibt es einen Haupt-Button, die anderen sind neutral umrandet oder Text-Buttons (Filter, Newsletter im Footer, Video laden, Blättern, Warenkorb aktualisieren).
- Geändert: Sonderpreis-Siegel getönt mit Text (vorher Vollfläche), Ausverkauft neutral umrandet. Der Sonderpreis steht in der Textfarbe, der Streichpreis durchgestrichen und gedämpft. Hinweise zum Preis sind jetzt mindestens 14 px groß.
- Geändert: Produktkarten mit Rahmen, ohne Hüpfen. Hover hell = Schatten, dunkel = hellere Fläche. Titel höchstens zwei Zeilen, Preis steht am Kartenende. Die Einstellung „Kartenstil“ bleibt.
- Geändert: Kopfzeile (Logo, Suche in der Mitte, Werkzeuge rechts, Menü in zweiter Zeile mit Unterstrich beim aktiven Punkt). Warenkorb-Zähler als Pille, bei leerem Warenkorb ohne Zähler. Die Kopfzeilen-Höhe wird für den festen Header gemessen.
- Geändert: Footer auf `surface-2`, Brotkrümel gedämpft, Seitenzahlen, Formulare (Platzhalter, Fokus) und Bildkante.
- Neu: Fehlerboxen mit Symbol, dem Wort „Fehler:“ und Rand (Kontakt, Passwort, Newsletter, Gutschein). Nie rot gefüllt.
- Geändert: Es gibt nur noch die Schriftgewichte 400 und 700 (Gewichte 600 und 800 gab es in den lokalen Schriften nicht).
- Behoben: Eigene Akzentfarbe (Experte): Die Schrift auf dem Button wird nach dem Kontrast gewählt (vorher nach der Helligkeit, mittelhelle Farben wie Orange hatten zu wenig Kontrast). Hover und Link-Ton werden abgeleitet.
- Geändert: Lieferzeit und Text der Ankündigungsleiste sind standardmäßig leer (vorher ein erfundener Beispieltext). Der Hilfetext nennt „Lieferzeit: 2–4 Werktage“ nur noch als Beispiel.
- Geändert: Die Farben der App-Glocke (Ordner `michatheme-v5-app`) kommen jetzt aus dem Theme statt fest eingetragen zu sein.
- Geprüft: offizielles Theme Check (keine Fehler, keine Warnungen), Tests der Plattform, Kontrast der Farben, Screenshots in Hell und Dunkel bei 1280 und 390 Pixel Breite aus einer statischen Vorschau mit Beispieldaten.
- Hinweis: Kasse, Danke-Seite, Bestellstatus und neue Kundenkonten steuert Shopify, nicht das Theme (siehe README).
- Bekannt offen: nicht im Theme Store, nicht in einem echten Shop oder Entwicklungs-Shop getestet (die Screenshots sind keine echten Shopify-Seiten), App ohne Oberfläche und ohne Installationsablauf.

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
