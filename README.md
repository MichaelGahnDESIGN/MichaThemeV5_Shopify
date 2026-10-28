# MichaThemeV5 für Shopify

Ein Theme für deinen Shopify-Shop von Michael Gahn DESIGN. Es hat einen Hell- und Dunkelmodus, viele Einstellungen und lokale Schriften (kein Google Fonts, kein CDN).

**Status: Entwurf (Pre-Alpha), Version 0.4.0.**
Das Theme ist noch nicht im Shopify Theme Store. Es ist noch nicht in einem echten Shop getestet. Geprüft ist es mit dem offiziellen Theme Check von Shopify (offline, ohne Anmeldung: keine Fehler, keine Warnungen) und mit der Prüfung der Plattform. Ein Test in einem Entwicklungs-Shop (`shopify theme dev`) steht noch aus. Nutze es zum Ausprobieren, zum Beispiel in einem Entwicklungs-Shop. Nicht für einen Live-Shop mit echten Kunden.

## Was ist in diesem Repo?

| Ordner / Datei | Was ist das? |
|---|---|
| `theme/` | Das Shopify-Theme. Das lädst du in deinen Shop. |
| `michatheme-v5-app/` | Die Notification-App (Benachrichtigungen). Sie gehört zum Theme. |
| `LICENSE` | Die Lizenz-Hinweise (siehe Abschnitt Lizenz). |
| `release-manifest.json` | Sagt, welche Theme-Version zu welcher App-Version passt. |
| `scripts/` | Prüf- und Bau-Skripte für Entwickler. |

## Theme installieren (Schritt für Schritt)

1. Öffne die Seite [Releases](https://github.com/MichaelGahnDESIGN/MichaThemeV5_Shopify/releases).
2. Lade die Datei `MichaThemeV5_Shopify-0.4.0.zip` herunter. Entpacke sie nicht.
3. Lade zum Prüfen auch `MichaThemeV5_Shopify-0.4.0.zip.sha256` herunter. Auf dem Mac gibst du im Terminal `shasum -a 256 -c MichaThemeV5_Shopify-0.4.0.zip.sha256` ein. Es muss `OK` erscheinen.
4. Gehe in deinem Shopify-Admin zu **Onlineshop → Themes**.
5. Klicke auf **Theme hinzufügen → ZIP-Datei hochladen** und wähle die ZIP-Datei.
6. Warte, bis das Theme hochgeladen ist. Klicke dann auf **Anpassen**, um es zuerst anzusehen.
7. Wenn alles passt, klicke auf **Veröffentlichen**. Mach vorher eine Sicherung deines aktuellen Themes (**Duplizieren**).

Du kannst auch die Shopify CLI nutzen: `shopify theme push --path theme` (im Ordner dieses Repos).

## Neues Aussehen (seit 0.3.0)

Das Theme sieht jetzt ruhiger und moderner aus. Es soll den anderen MichaThemeV5-Themes (WooCommerce, Shopware, JTL-Shop) ähnlich sehen.

- Hell: weiße Karten auf hellgrauem Grund. Dunkel: Anthrazit, nicht schwarz.
- Die Standard-Akzentfarbe ist jetzt **Rot**. Du kannst sie in den Theme-Einstellungen bei **Farben** ändern oder eine eigene Farbe wählen. Wer schon einen Akzent gespeichert hat, behält ihn.
- Rot steht nur bei Dingen, die man anklickt: Kaufen-Button, aktiver Menüpunkt, aktuelle Seite, Zähler am Warenkorb. Alle anderen Buttons sind grau umrandet.
- Das Sonderpreis-Siegel ist hellrot mit Text (nicht knallrot). Fehlermeldungen haben ein Symbol, das Wort „Fehler:“ und einen Rand.
- Produktkarten haben einen Rahmen und hüpfen nicht mehr beim Darüberfahren. Die Einstellung „Kartenstil“ gibt es weiter.
- Kopfzeile: Logo links, Suche in der Mitte, rechts die Icon-Leiste. Das Menü steht darunter in einer zweiten Zeile.
- Icon-Leiste von links nach rechts: Hell/Dunkel-Schalter (nur Symbol), Glocke (nur wenn es Meldungen gibt), Favoriten (Herz, nur wenn du eines gemerkt hast), Konto, Warenkorb.
- Favoriten: Auf jeder Produktkarte und auf der Artikelseite sitzt ein Herz. Die Liste bleibt nur im Browser des Besuchers und geht nicht an den Shop. Ausschalten: Theme-Einstellungen, Kopfzeile, „Favoriten“.
- Keine Merkliste: Shopify hat keine eigene Wunschliste. Darum gibt es dafür kein Symbol.
- Ort des Hell/Dunkel-Schalters (Theme-Einstellungen, Farben): „Header“ oder „Footer“. „Benutzerkonto-Einstellungen“ geht bei Shopify nicht richtig: Das Kundenkonto gehört Shopify, das Theme kann dort nichts einfügen. Bei dieser Wahl steht der Schalter als Zeile im Footer.
- Eigene Akzentfarbe: Die Schrift auf dem Button wird jetzt nach dem Kontrast gewählt (schwarz oder weiß, mindestens 4,5 zu 1).
- Die Lieferzeit und der Text der Ankündigungsleiste sind jetzt **leer**. Bitte trage nur ein, was in deinem Shop wirklich stimmt.

## Was das Theme in Shopify nicht steuert

- Die **Kasse**, die **Danke-Seite**, der Bestellstatus und die **neuen Kundenkonten** gehören Shopify. Das Theme kann ihr Aussehen nicht ändern. Nach unserem Kenntnisstand stellst du sie im Shopify-Admin unter **Einstellungen → Kasse → Anpassen** ein (Logo, Farben, Ecken). Was dort möglich ist, hängt von deinem Tarif ab. Das haben wir nicht in einem Shop geprüft.
- Tipp: Nimm dort dasselbe Rot und dasselbe Logo wie im Theme, dann sieht es zusammenpassend aus.
- Den Text des Bestell-Buttons legt Shopify fest. Prüfe in einer Test-Bestellung, dass er eindeutig „zahlungspflichtig“ ist.

## Benachrichtigungs-Glocke einschalten

Die Glocke ist beim Start **aus**. So schaltest du sie ein:

1. Öffne im Shopify-Admin **Onlineshop → Themes → Anpassen**.
2. Klicke links auf **Theme-Einstellungen** und dann auf **Benachrichtigungen**.
3. Wähle bei **Platzierung der Glocke** einen Platz: Kopfzeile (neben dem Warenkorb), Footer oder schwebend unten rechts oder links.
4. Speichern.

Die Glocke erscheint nur, wenn ein Platz gewählt ist **und** die App (siehe unten) mindestens eine Meldung liefert. Ohne App bleibt sie unsichtbar. Im Theme-Editor siehst du dann einen Hinweis. Die Glocke ist ein Button: Du kannst sie mit der Tastatur bedienen (Enter oder Leertaste öffnet, Escape schließt).

Der Pfad der App steht darunter unter **App-Proxy-Pfad** (Experte). Er muss zum Pfad in der App passen.

## Notification-App installieren

Die Benachrichtigungs-Glocke braucht die App im Ordner `michatheme-v5-app/`. Ohne App zeigt die Glocke keine Meldungen an.

1. Installiere Node.js 20 oder neuer.
2. Öffne ein Terminal im Ordner `michatheme-v5-app/`.
3. Prüfe die App mit `npm test`.
4. Die App braucht einen eigenen Server mit einer Postgres-Datenbank. Das Datenbankschema steht in `michatheme-v5-app/database/schema.sql`.
5. Trage deine Shopify-Zugangsdaten als Umgebungsvariablen ein (`SHOPIFY_API_KEY`, `SHOPIFY_APP_URL`). Lege sie nie in dieses Repo.
6. Richte die App über die Shopify CLI ein (`shopify app deploy`). Der App-Proxy-Pfad muss `/apps/michatheme-notifications` sein.
7. Aktiviere die App **vor** dem Theme. Mehr dazu steht in `COMPATIBILITY.md`.

## Was fehlt noch? (ehrlich)

- Keine App-Oberfläche im Shopify-Admin. Es gibt nur die Schnittstelle `/admin/notifications`.
- Kein Installations- oder Anmeldeablauf (OAuth) in der App.
- Die Datenschutz-Auskunft (`customers/data_request`) liefert noch nichts zurück.
- Die App ist nicht bei Shopify eingereicht. Dieses Release ist keine App-Store-Einreichung.
- Die Pro-Funktionen sind nicht Teil dieses Repos. Dieses Repo enthält nur die kostenlosen Funktionen.
- Das Theme ist noch in keinem echten Shop und in keinem Entwicklungs-Shop getestet. Theme Check und die Prüfung der Plattform finden nur Fehler im Code, nicht im Aussehen oder im Ablauf.

## Lizenz

Kurz und einfach:

- Das Theme gehört Michael Gahn DESIGN. Es gilt: **Alle Rechte vorbehalten** (siehe Datei `LICENSE`). Das heißt vereinfacht: Wer das Theme nutzen, weitergeben oder verändern will, braucht dafür die Erlaubnis von Michael Gahn DESIGN. Wie diese Erlaubnis genau aussieht, ist noch nicht festgelegt. Es ist keine Open-Source-Lizenz. So steht es auch in `theme/layout/theme.liquid` und so ist es bei den anderen MichaThemeV5-Themes.
- Die Schriften im Theme stehen unter der SIL Open Font License 1.1. Die Texte stehen in `theme/snippets/mt-font-licenses.liquid`.
- Fremder Code behält seine eigene Lizenz.

Das ist keine Rechtsberatung; die Lizenzfrage wird noch rechtlich geprüft.

## Datenschutz der App

Die App speichert nur Shop-ID, Kunden-ID, Nachricht, Ereignisquelle und Lesestatus. Anfragen über den App-Proxy werden auf ihre Signatur geprüft. Webhooks werden am Rohtext mit HMAC geprüft. Doppelte Webhooks werden über `X-Shopify-Webhook-Id` erkannt.

## Für Entwickler

- Prüfen: `node scripts/check-release.mjs` (Ordner, JSON, Versionen, Lizenzdatei, Zugangsdaten).
- Theme Check von Shopify (offline, ohne Anmeldung): `npm install --no-save --no-package-lock @shopify/theme-check-node@3.31.0`, dann `node scripts/theme-check.mjs`.
- ZIP bauen: `bash scripts/build-release.sh` (legt `dist/MichaThemeV5_Shopify-0.4.0.zip` und die `.sha256`-Datei an).
- Das ZIP enthält nur den Inhalt von `theme/`, direkt im ZIP-Stamm (so erwartet es Shopify).
- Jede Datei mit der Version muss gleich sein: `theme/config/settings_schema.json` (`theme_version`), `release-manifest.json`, `michatheme-v5-app/package.json`, dieses README und `CHANGELOG.md`.
- Das ganze Theme wird in der privaten Plattform erzeugt (auch die Glocke). Änderungen am Theme gehören dorthin, nicht von Hand in `theme/`. Bauen: `php bin/build-themes.php shopify <dieses Repo>/theme --version=<Version>` im Plattform-Repo. Danach hier `theme/` ersetzen und prüfen.
