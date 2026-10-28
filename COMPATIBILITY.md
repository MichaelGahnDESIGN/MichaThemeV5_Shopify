# Kompatibilität

`release-manifest.json` ist die verbindliche Kopplung zwischen MichaThemeV5 und der MichaThemeV5-App. Vor einem Release müssen `theme.requiresAppApi` und `app.apiVersion` übereinstimmen. Die App muss vor dem Theme aktiviert werden, damit persönliche Meldungen nicht auf einen fehlenden oder inkompatiblen Endpunkt treffen.

Bei einer Nichtübereinstimmung zeigt die Oberfläche ausschließlich öffentliche Meldungen. Kundendaten werden dann nicht angefordert.

Die eingebettete App verwaltet manuelle Meldungen über `GET` und `POST /admin/notifications`. Jede Anfrage benötigt einen von Shopify App Bridge erzeugten Session-Token. Der Server prüft dessen HMAC, Ablaufdatum und Shop-Domain. Dieses API ist der Backend-Vertrag für die App-Oberfläche; Theme-Code erhält keinen Admin-Zugang und keine Kundendaten.

Die Glocke im Theme ist beim Start aus. Sie erscheint erst, wenn in den Theme-Einstellungen (Benachrichtigungen) eine Platzierung gewählt ist und die App mit einer passenden API-Version antwortet und mindestens eine Meldung liefert.
