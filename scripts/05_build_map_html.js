/**
 * Script: 05_build_map_html.js
 * Purpose: Node.js entry point to generate the standalone production interactive Leaflet web map (index.html).
 * Delegating to 05_build_map_html.py for robust HTML templating without JS backtick escape conflicts.
 */

const { execSync } = require('child_process');
const path = require('path');

const pythonScript = path.join(__dirname, '05_build_map_html.py');
try {
  execSync(`python "${pythonScript}"`, { stdio: 'inherit' });
} catch (e) {
  console.error('[ERROR] Failed to execute 05_build_map_html.py:', e);
  process.exit(1);
}
