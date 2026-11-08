/**
 * Liefert die einzige eingebettete Shopify-Adminansicht der App.
 *
 * Die Seite selbst enthält keine geschützten Empfehlungsdaten. Erst das lokale
 * Skript fordert diese mit einem von App Bridge ausgestellten ID-Token von der
 * eigenen App-Route an. Dadurch bleiben Shop-, Sitzungs- und Besucherdaten
 * vollständig innerhalb der Shopify-App-Grenze.
 */
export function renderAdminPage(apiKey) {
  if (!apiKey) return null;
  const safeApiKey = String(apiKey).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="shopify-api-key" content="${safeApiKey}">
  <title>MGD Plugin-Empfehlungen</title>
  <link rel="stylesheet" href="/assets/admin-recommendations.css">
  <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" data-api-key="${safeApiKey}"></script>
  <script defer src="/assets/admin-recommendations.js"></script>
</head>
<body>
  <main class="mgd-admin" aria-labelledby="mgd-title">
    <header class="mgd-admin__header">
      <p class="mgd-admin__eyebrow">Micha Gahn Development</p>
      <h1 id="mgd-title">Plugin-Empfehlungen</h1>
      <p>Passende Erweiterungen für deinen Shopify-Shop.</p>
    </header>
    <section aria-labelledby="mgd-recommendations-title">
      <h2 id="mgd-recommendations-title" class="mgd-visually-hidden">Empfehlungen</h2>
      <p id="mgd-status" role="status" aria-live="polite">Empfehlungen werden geladen …</p>
      <div id="mgd-recommendations" class="mgd-cards" aria-busy="true"></div>
    </section>
  </main>
</body>
</html>`;
}

/** Header begrenzen die eingebettete Seite auf Shopify und lokale Ressourcen. */
export function adminPageHeaders() {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    // App Bridge ist der einzige externe Bestandteil und dient nur der Shopify-Authentifizierung.
    'Content-Security-Policy': "default-src 'self'; script-src 'self' https://cdn.shopify.com; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors https://admin.shopify.com https://*.myshopify.com",
    'Referrer-Policy': 'no-referrer',
  };
}
