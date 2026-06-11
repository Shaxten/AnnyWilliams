/**
 * Génère des dossiers avec index.html pour chaque route Angular
 * → résout les 404 sur GitHub Pages pour Google et les crawlers
 * Exécuter après le build: node scripts/generate-routes.js
 */
const fs   = require('fs');
const path = require('path');

const DIST   = path.join(__dirname, '..', 'dist', 'AnnyWilliams', 'browser');
const ROUTES = ['services', 'tarifs', 'a-propos', 'reservation'];

// Lire index.html principal
const indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

ROUTES.forEach(function (route) {
  const dir = path.join(DIST, route);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'index.html'), indexHtml);
  console.log('Created: ' + route + '/index.html');
});

console.log('Done — ' + ROUTES.length + ' routes generated.');
