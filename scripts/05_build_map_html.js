/**
 * Script: 05_build_map_html.js
 * Purpose: Generate the standalone production interactive Leaflet web map (index.html).
 * Ingests:
 *   - data/ortigas/final_reconciled_properties.json
 *   - data/ortigas/boundaries.json
 * Outputs:
 *   - index.html (Root production deployment for GitHub Pages)
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.dirname(__dirname);
const boundaries = JSON.parse(fs.readFileSync(path.join(baseDir, 'data', 'ortigas', 'boundaries.json'), 'utf8'));
const properties = JSON.parse(fs.readFileSync(path.join(baseDir, 'data', 'ortigas', 'final_reconciled_properties.json'), 'utf8'));

const cbdRing = boundaries.ortigasCbdPerimeter;
const saRing = boundaries.barangaySanAntonioPerimeter;
const bboxBounds = boundaries.bboxBounds;

const pageContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ortigas Center - Official BIR Zonal Values Property Map (100% Excel Reconciled)</title>
  
  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; width: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; overflow: hidden; color: #0f172a; }
    #map { height: 100%; width: 100%; z-index: 1; }

    .floating-card { position: absolute; z-index: 1000; background: rgba(255, 255, 255, 0.98); border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18); backdrop-filter: blur(12px); border: 1px solid rgba(0, 0, 0, 0.08); transition: all 0.2s ease; }
    .panel { top: 16px; right: 16px; width: 440px; max-height: calc(100vh - 32px); display: flex; flex-direction: column; }
    .panel-header { padding: 16px 20px 12px 20px; border-bottom: 1px solid #e2e8f0; }
    .panel-header h1 { font-size: 1.15rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; justify-content: space-between; }
    .badge-bir { font-size: 0.68rem; background: #059669; color: white; padding: 2px 7px; border-radius: 9999px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .source-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 6px; }
    .source-tag:hover { background: #dbeafe; }

    .tab-bar { display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
    .tab-btn { flex: 1; padding: 10px 4px; border: none; background: transparent; font-size: 0.76rem; font-weight: 600; color: #64748b; cursor: pointer; text-align: center; border-bottom: 2px solid transparent; transition: all 0.15s; }
    .tab-btn:hover { color: #0f172a; background: #f1f5f9; }
    .tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; background: #ffffff; }

    .tab-content { padding: 16px 20px; overflow-y: auto; flex: 1; }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }
    .section-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-top: 14px; margin-bottom: 8px; }
    .section-title:first-child { margin-top: 0; }

    .layer-selector-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; display: flex; flex-direction: column; gap: 5px; }
    .layer-radio-row { display: flex; align-items: center; gap: 10px; font-size: 0.81rem; font-weight: 600; color: #334155; padding: 6px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
    .layer-radio-row:hover { background: #f1f5f9; }
    .layer-radio-row.active { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .layer-radio-row input[type="radio"] { accent-color: #2563eb; cursor: pointer; }
    .layer-code-pill { font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-left: auto; }
    .pill-cr { background: #f3e8ff; color: #7e22ce; }
    .pill-cc { background: #dbeafe; color: #1e40af; }
    .pill-rr { background: #fee2e2; color: #b91c1c; }
    .pill-rc { background: #ffedd5; color: #c2410c; }
    .pill-ps { background: #dcfce7; color: #15803d; }
    .pill-inst { background: #e0e7ff; color: #4338ca; }

    .rate-hud { bottom: 24px; left: 16px; width: 340px; max-width: calc(100vw - 32px); background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: 12px; box-shadow: 0 12px 36px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.08); border: 1px solid rgba(226, 232, 240, 0.95); overflow: hidden; z-index: 999; }
    .rate-hud-header { padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; }
    .rate-hud-title { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 700; color: #0f172a; }
    .rate-hud-pill { font-size: 0.68rem; font-weight: 800; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px; }
    .rate-hud-toggle { background: transparent; border: 1px solid #cbd5e1; color: #475569; cursor: pointer; font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: 5px; transition: all 0.15s; }
    .rate-hud-toggle:hover { background: #e2e8f0; color: #0f172a; }
    .rate-hud-body { padding: 10px 14px 12px 14px; display: flex; flex-direction: column; gap: 7px; }
    .rate-gradient-bar { height: 5px; border-radius: 3px; width: 100%; margin-bottom: 3px; }
    .rate-tier-row { display: flex; align-items: flex-start; gap: 9px; padding: 3px 4px; border-radius: 6px; transition: background 0.15s; }
    .rate-tier-row:hover { background: #f1f5f9; }
    .rate-tier-swatch { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; margin-top: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.12); }
    .rate-tier-info { flex: 1; line-height: 1.35; }
    .rate-tier-val { font-size: 0.77rem; font-weight: 700; color: #0f172a; display: flex; justify-content: space-between; align-items: baseline; }
    .rate-tier-desc { font-size: 0.68rem; color: #64748b; margin-top: 1px; }
    .rate-tier-na { background: #f8fafc; border: 1px dashed #cbd5e1; padding: 6px 8px; border-radius: 6px; margin-top: 2px; }
    .rate-tier-na .rate-tier-val { color: #64748b; font-weight: 600; font-size: 0.74rem; }
    .rate-tier-na .rate-tier-desc { color: #94a3b8; font-size: 0.67rem; }

    .shortcut-pill { font-size: 0.70rem; font-weight: 600; padding: 3px 8px; border-radius: 12px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    .shortcut-pill:hover { background: #2563eb; color: #ffffff; border-color: #2563eb; }

    .form-group { margin-bottom: 12px; }
    .form-group label { display: block; font-size: 0.76rem; font-weight: 600; color: #334155; margin-bottom: 4px; }
    .form-control { width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.84rem; background: #ffffff; }
    .form-control:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.2); }

    .calc-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 12px; }
    .calc-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.81rem; padding: 4px 0; color: #475569; }
    .calc-row.total { font-weight: 700; color: #0f172a; border-top: 1px solid #cbd5e1; margin-top: 6px; padding-top: 8px; font-size: 0.93rem; }
    .calc-row .val { font-weight: 600; color: #0f172a; }

    .table-container { max-height: 380px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; }
    .zonal-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
    .zonal-table th { position: sticky; top: 0; background: #f1f5f9; color: #334155; text-align: left; padding: 8px; font-weight: 600; border-bottom: 1px solid #cbd5e1; z-index: 2; }
    .zonal-table td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
    .zonal-table tr:hover td { background: #eff6ff; }

    .btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 8px 12px; border-radius: 6px; font-size: 0.82rem; font-weight: 600; cursor: pointer; border: none; margin-top: 8px; transition: all 0.15s; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div id="map"></div>

  <!-- On-Map Floating Rate Color Card HUD -->
  <div id="rate-hud" class="floating-card rate-hud">
    <div class="rate-hud-header" onclick="toggleRateHud()">
      <div class="rate-hud-title">
        <span id="rate-hud-badge" class="rate-hud-pill pill-cr">CR</span>
        <span id="rate-hud-heading">Commercial Regular (Land)</span>
      </div>
      <button class="rate-hud-toggle" id="rate-hud-toggle-btn" title="Minimize / Expand">Collapse &minus;</button>
    </div>
    <div class="rate-hud-body" id="rate-hud-body">
      <div id="rate-hud-gradient" class="rate-gradient-bar"></div>
      <div id="rate-hud-tiers"></div>
    </div>
  </div>

  <!-- Floating Sidebar Panel -->
  <div class="floating-card panel">
    <div class="panel-header">
      <h1>Ortigas Center <span class="badge-bir">Official BIR Reconciled</span></h1>
      <a href="https://www.bir.gov.ph/zonal-values?hl=en-US" target="_blank" rel="noopener noreferrer" class="source-tag">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        Source: BIR Official XLS Schedules (3 LGUs / RDOs)
      </a>
    </div>

    <div class="tab-bar">
      <button class="tab-btn active" onclick="switchTab('tab-layers')">6 Classification Layers</button>
      <button class="tab-btn" onclick="switchTab('tab-directory')">Directory</button>
      <button class="tab-btn" onclick="switchTab('tab-calculator')">Tax Calculator</button>
      <button class="tab-btn" onclick="switchTab('tab-audit')">BIR Audit Trail</button>
    </div>

    <div class="tab-content">
      <div id="tab-layers" class="tab-pane active">
        <div class="section-title">Select BIR Classification Layer</div>
        <div class="layer-selector-card">
          <label class="layer-radio-row active" id="row-CR">
            <input type="radio" name="layer-mode" value="CR" checked onchange="updateActiveLayer('CR')" />
            <span>1. Commercial Regular (CR) &mdash; Land / Lots</span>
            <span class="layer-code-pill pill-cr">CR</span>
          </label>
          <label class="layer-radio-row" id="row-CC">
            <input type="radio" name="layer-mode" value="CC" onchange="updateActiveLayer('CC')" />
            <span>2. Commercial Condo (CC) &mdash; Office Units</span>
            <span class="layer-code-pill pill-cc">CC</span>
          </label>
          <label class="layer-radio-row" id="row-RR">
            <input type="radio" name="layer-mode" value="RR" onchange="updateActiveLayer('RR')" />
            <span>3. Residential Regular (RR) &mdash; Land / Lots</span>
            <span class="layer-code-pill pill-rr">RR</span>
          </label>
          <label class="layer-radio-row" id="row-RC">
            <input type="radio" name="layer-mode" value="RC" onchange="updateActiveLayer('RC')" />
            <span>4. Residential Condo (RC) &mdash; Dwelling Units</span>
            <span class="layer-code-pill pill-rc">RC</span>
          </label>
          <label class="layer-radio-row" id="row-PS">
            <input type="radio" name="layer-mode" value="PS" onchange="updateActiveLayer('PS')" />
            <span>5. Parking Slot (PS) &mdash; 70% Statutory Rule</span>
            <span class="layer-code-pill pill-ps">PS</span>
          </label>
          <label class="layer-radio-row" id="row-INST">
            <input type="radio" name="layer-mode" value="INST" onchange="updateActiveLayer('INST')" />
            <span>6. Institutional &amp; Government (X / GL)</span>
            <span class="layer-code-pill pill-inst">X / GL</span>
          </label>
        </div>

        <div class="section-title">Active Classification Info</div>
        <div id="layer-summary-box" style="font-size: 0.76rem; color: #334155; line-height: 1.45; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;"></div>

        <div class="section-title">Governing BIR Department Orders</div>
        <div style="font-size: 0.75rem; color: #475569; line-height: 1.45; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <strong>Total Mapped Properties:</strong> ${properties.length} building footprints<br/>
          • <strong>Pasig City (RDO 43):</strong> D.O. 024-2023 (Brgy. San Antonio)<br/>
          • <strong>Mandaluyong City (RDO 41):</strong> D.O. 059-2022 (Brgy. Wack-Wack - Greenhills East)<br/>
          • <strong>Quezon City (RDO 40):</strong> D.O. 21-2020 (Brgy. Ugong Norte)<br/>
          <em>* Note: Greyed out polygons on any layer represent non-applicable property types and are completely unclickable.</em>
        </div>

        <div class="section-title">Perimeter Overlays</div>
        <label style="display: flex; align-items: center; margin-bottom: 6px; font-size: 0.82rem; cursor: pointer;">
          <input type="checkbox" id="chk-cbd" checked style="margin-right: 8px;" />
          <span>Ortigas Center Boundary (128-pt Loop)</span>
        </label>
        <label style="display: flex; align-items: center; margin-bottom: 6px; font-size: 0.82rem; cursor: pointer;">
          <input type="checkbox" id="chk-sa" style="margin-right: 8px;" />
          <span>Brgy. San Antonio Boundary (Pasig Side)</span>
        </label>
        <label style="display: flex; align-items: center; margin-bottom: 6px; font-size: 0.82rem; cursor: pointer;">
          <input type="checkbox" id="chk-bbox" style="margin-right: 8px;" />
          <span>Bounding Box Envelope</span>
        </label>
        <button class="btn btn-primary" onclick="fitCbd()">Zoom to Full Ortigas Center</button>
      </div>

      <div id="tab-directory" class="tab-pane">
        <div class="form-group">
          <label>Filter across all ${properties.length} properties:</label>
          <input type="text" id="dir-filter" class="form-control" placeholder="Search building, street, or Excel row..." onkeyup="filterDirectory()" />
        </div>
        <div style="margin-bottom: 10px;">
          <div style="font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.4px;">Quick Landmark Jump:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 5px;">
            <button class="shortcut-pill" onclick="quickJump('One Shangri-La Place')">📍 One Shangri-La</button>
            <button class="shortcut-pill" onclick="quickJump('The St. Francis Shangri-La Place')">📍 St. Francis Shangri-La</button>
            <button class="shortcut-pill" onclick="quickJump('Megamall')">SM Megamall</button>
            <button class="shortcut-pill" onclick="quickJump('Galleon')">The Galleon</button>
            <button class="shortcut-pill" onclick="quickJump('Tektite')">Tektite Towers</button>
            <button class="shortcut-pill" onclick="quickJump('Asian Development Bank')">ADB Headquarters</button>
            <button class="shortcut-pill" onclick="quickJump('Robinsons Galleria')">Robinsons Galleria</button>
          </div>
        </div>
        <div class="table-container">
          <table class="zonal-table" id="directory-table">
            <thead>
              <tr><th>Property / Address</th><th>BIR Source Row</th><th style="text-align: right;" id="col-rate-header">CR Rate</th></tr>
            </thead>
            <tbody id="directory-tbody"></tbody>
          </table>
        </div>
      </div>

      <div id="tab-calculator" class="tab-pane">
        <p style="font-size: 0.79rem; color: #475569; margin-bottom: 10px;">Calculate transfer taxes based on verbatim official BIR zonal values.</p>
        <div class="form-group">
          <label>Select Property / Development:</label>
          <select id="calc-property" class="form-control" onchange="runTaxCalc()"></select>
        </div>
        <div class="form-group">
          <label>Select Classification Base:</label>
          <select id="calc-type" class="form-control" onchange="runTaxCalc()">
            <option value="CR">Commercial Regular (CR - Land / Lot)</option>
            <option value="CC" selected>Commercial Condominium (CC - Office Unit)</option>
            <option value="RR">Residential Regular (RR - Land / Lot)</option>
            <option value="RC">Residential Condominium (RC - Dwelling Unit)</option>
            <option value="PS">Parking Slot (PS - 70% Statutory Rule)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Floor / Lot Area (sqm):</label>
          <input type="number" id="calc-area" class="form-control" value="60" min="1" oninput="runTaxCalc()" />
        </div>
        <div class="calc-card">
          <div class="calc-row"><span>Applicable BIR Zonal Rate:</span><span class="val" id="res-rate">₱141,000 / sqm</span></div>
          <div class="calc-row"><span>BIR Excel Reference:</span><span class="val" id="res-rdo" style="font-size: 0.73rem;">Sheet 9 (Row 2928)</span></div>
          <div class="calc-row total"><span>Total Zonal Base:</span><span class="val" id="res-total" style="color: #2563eb;">₱8,460,000</span></div>
          <hr style="margin: 8px 0; border: none; border-top: 1px dashed #cbd5e1;" />
          <div class="calc-row"><span>Capital Gains Tax (CGT 6%):</span><span class="val" id="res-cgt">₱507,600</span></div>
          <div class="calc-row"><span>Documentary Stamp Tax (DST 1.5%):</span><span class="val" id="res-dst">₱126,900</span></div>
          <div class="calc-row"><span>Est. Local Transfer Tax (~0.75%):</span><span class="val" id="res-ltt">₱63,450</span></div>
          <div class="calc-row total"><span>Total Estimated Taxes:</span><span class="val" id="res-grand-tax" style="color: #dc2626;">₱697,950</span></div>
        </div>
      </div>

      <div id="tab-audit" class="tab-pane">
        <div class="section-title">Official BIR Source Audit Trail</div>
        <div style="font-size: 0.76rem; color: #334155; line-height: 1.5; display: flex; flex-direction: column; gap: 8px;">
          <div style="padding: 8px; background: #eff6ff; border-left: 3px solid #2563eb; border-radius: 4px;">
            <strong style="color: #1e40af;">Pasig City (RDO 43):</strong><br/>
            • Workbook: <code>RDO No. 43 - Pasig City.xls</code><br/>
            • Schedule: Sheet 9 (DO 24-2023, 7th Revision)<br/>
            • Coverage: Rows 2642 to 3056 exclusively for Brgy. San Antonio.
          </div>
          <div style="padding: 8px; background: #faf5ff; border-left: 3px solid #7e22ce; border-radius: 4px;">
            <strong style="color: #6b21a8;">Mandaluyong City (RDO 41):</strong><br/>
            • Workbook: <code>RDO No. 41 - Mandaluyong City.xls</code><br/>
            • Schedule: Sheet 9 (DO 059-2022, 8th Revision)<br/>
            • Coverage: Rows 1483 to 1604 exclusively for Brgy. Wack-Wack - Greenhills East.
          </div>
          <div style="padding: 8px; background: #fff7ed; border-left: 3px solid #ea580c; border-radius: 4px;">
            <strong style="color: #9a3412;">Quezon City (RDO 40 - Cubao):</strong><br/>
            • Workbook: <code>RDO No. 40 - Cubao.xls</code><br/>
            • Schedule: Sheet 7 (DO 21-2020, 6th Revision)<br/>
            • Coverage: Rows 2312 to 2358 exclusively for Brgy. Ugong Norte.
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Leaflet JS -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const cbdPolygonCoords = ${JSON.stringify(cbdRing)};
    const sanAntonioCoords = ${JSON.stringify(saRing)};
    const properties = ${JSON.stringify(properties)};
    const bboxBounds = ${JSON.stringify(bboxBounds)};

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' });
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' });
    const positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, attribution: '&copy; CartoDB' });

    const map = L.map('map', { layers: [osm], zoomControl: false }).fitBounds(cbdPolygonCoords, { padding: [40, 40] });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.layers({ "OpenStreetMap (Streets)": osm, "Esri World Imagery (Satellite)": satellite, "CartoDB Positron (Light)": positron }, null, { position: 'topleft' }).addTo(map);

    const cbdLayer = L.polygon(cbdPolygonCoords, { color: '#1e3a8a', weight: 3.5, opacity: 0.9, fillColor: 'transparent' }).addTo(map);
    const saLayer = L.polygon(sanAntonioCoords, { color: '#059669', weight: 2, dashArray: '5, 5', fillColor: '#10b981', fillOpacity: 0.05 });
    const bboxLayer = L.rectangle(bboxBounds, { color: '#ef4444', weight: 2, dashArray: '5, 5', fillColor: '#ef4444', fillOpacity: 0.03 });

    let currentLayerMode = 'CR';

    function isPropertyApplicable(p, mode) {
      if (mode === 'CR' || mode === 'RR') return true;
      if (mode === 'CC') return !!p.ccVal;
      if (mode === 'RC') return !!p.rcVal;
      if (mode === 'PS') return !!p.psVal;
      if (mode === 'INST') return !!p.isInstitutional;
      return false;
    }

    function getPropertyStyle(p, mode) {
      const applicable = isPropertyApplicable(p, mode);
      if (!applicable) {
        return { fillColor: '#94a3b8', fillOpacity: 0.12, color: '#cbd5e1', weight: 0.5, dashArray: '2, 2' };
      }

      if (mode === 'CR') {
        const v = p.crVal;
        let c = '#0d9488';
        if (v >= 315000) c = '#7e22ce';
        else if (v >= 280000) c = '#2563eb';
        else if (v >= 240000) c = '#0284c7';
        return { fillColor: c, fillOpacity: 0.82, color: '#1e293b', weight: 1.1 };
      } else if (mode === 'CC') {
        const v = p.ccVal;
        let c = '#10b981';
        if (v >= 240000) c = '#581c87';
        else if (v >= 150000) c = '#2563eb';
        else if (v >= 136000) c = '#06b6d4';
        const isBase = p.ccStatus && !p.ccStatus.includes('Official Building Rate');
        return { fillColor: c, fillOpacity: isBase ? 0.55 : 0.88, color: '#1e293b', weight: isBase ? 0.8 : 1.3 };
      } else if (mode === 'RR') {
        const v = p.rrVal;
        let c = '#65a30d';
        if (v >= 200000) c = '#b91c1c';
        else if (v >= 140000) c = '#ea580c';
        else if (v >= 120000) c = '#d97706';
        else if (v >= 110000) c = '#ca8a04';
        return { fillColor: c, fillOpacity: 0.82, color: '#1e293b', weight: 1.1 };
      } else if (mode === 'RC') {
        const v = p.rcVal;
        let c = '#84cc16';
        if (v >= 225000) c = '#991b1b';
        else if (v >= 160000) c = '#ea580c';
        else if (v >= 120000) c = '#eab308';
        const isBase = p.rcStatus && !p.rcStatus.includes('Official Building Rate');
        return { fillColor: c, fillOpacity: isBase ? 0.55 : 0.88, color: '#1e293b', weight: isBase ? 0.8 : 1.3 };
      } else if (mode === 'PS') {
        const v = p.psVal;
        let c = '#34d399';
        if (v >= 180000) c = '#064e3b';
        else if (v >= 113000) c = '#059669';
        else if (v >= 90000) c = '#10b981';
        return { fillColor: c, fillOpacity: 0.82, color: '#1e293b', weight: 1.1 };
      } else {
        return { fillColor: p.instClass === 'GL' ? '#2563eb' : '#9333ea', fillOpacity: 0.9, color: p.instClass === 'GL' ? '#1e3a8a' : '#581c87', weight: 2.5 };
      }
    }

    function applyPolygonInteractivity(poly, mode) {
      const applicable = isPropertyApplicable(poly.propertyData, mode);
      if (poly._path) {
        poly._path.style.pointerEvents = applicable ? 'auto' : 'none';
        poly._path.style.cursor = applicable ? 'pointer' : 'default';
      }
    }

    function getPopupHtml(p, mode) {
      let activeRateDisplay = '';
      if (mode === 'CR') {
        activeRateDisplay = \`
          <div style="background:#f3e8ff; border:1px solid #d8b4fe; padding:8px 10px; border-radius:6px; margin:8px 0;">
            <div style="font-size:11px; font-weight:700; color:#7e22ce; text-transform:uppercase;">Active Layer: CR Land Rate</div>
            <div style="font-size:17px; font-weight:800; color:#581c87; margin-top:2px;">₱\${p.crVal.toLocaleString()} / sqm</div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">Commercial Regular Raw Land Base</div>
          </div>
        \`;
      } else if (mode === 'CC') {
        if (!p.ccVal) {
          activeRateDisplay = \`
            <div style="background:#f1f5f9; border:1px solid #cbd5e1; padding:8px 10px; border-radius:6px; margin:8px 0;">
              <div style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase;">Active Layer: CC Commercial Condo</div>
              <div style="font-size:15px; font-weight:800; color:#64748b; margin-top:2px;">Not Applicable (N/A)</div>
              <div style="font-size:11px; color:#475569; margin-top:2px;">\${p.ccStatus} &bull; Applicable Base: <strong>CR Land @ ₱\${p.crVal.toLocaleString()} / sqm</strong></div>
            </div>
          \`;
        } else {
          const isOfficial = p.ccStatus && p.ccStatus.includes('Official Building Rate');
          activeRateDisplay = \`
            <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:8px 10px; border-radius:6px; margin:8px 0;">
              <div style="font-size:11px; font-weight:700; color:#1e40af; text-transform:uppercase;">Active Layer: CC Condo Rate</div>
              <div style="font-size:17px; font-weight:800; color:#1d4ed8; margin-top:2px;">₱\${p.ccVal.toLocaleString()} / sqm</div>
              <div style="font-size:11px; color:\${isOfficial ? '#15803d' : '#64748b'}; font-weight:600; margin-top:2px;">\${isOfficial ? '✓ Official Building Schedule Rate' : '• Barangay Baseline (All Other Condos)'}</div>
            </div>
          \`;
        }
      } else if (mode === 'RR') {
        activeRateDisplay = \`
          <div style="background:#fee2e2; border:1px solid #fca5a5; padding:8px 10px; border-radius:6px; margin:8px 0;">
            <div style="font-size:11px; font-weight:700; color:#b91c1c; text-transform:uppercase;">Active Layer: RR Land Rate</div>
            <div style="font-size:17px; font-weight:800; color:#991b1b; margin-top:2px;">₱\${p.rrVal.toLocaleString()} / sqm</div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">Residential Regular Raw Land Base</div>
          </div>
        \`;
      } else if (mode === 'RC') {
        if (!p.rcVal) {
          activeRateDisplay = \`
            <div style="background:#f1f5f9; border:1px solid #cbd5e1; padding:8px 10px; border-radius:6px; margin:8px 0;">
              <div style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase;">Active Layer: RC Residential Condo</div>
              <div style="font-size:15px; font-weight:800; color:#64748b; margin-top:2px;">Not Applicable (N/A)</div>
              <div style="font-size:11px; color:#475569; margin-top:2px;">\${p.rcStatus} &bull; Applicable Base: <strong>CR Land @ ₱\${p.crVal.toLocaleString()} / sqm</strong></div>
            </div>
          \`;
        } else {
          const isOfficial = p.rcStatus && p.rcStatus.includes('Official Building Rate');
          activeRateDisplay = \`
            <div style="background:#ffedd5; border:1px solid #fed7aa; padding:8px 10px; border-radius:6px; margin:8px 0;">
              <div style="font-size:11px; font-weight:700; color:#c2410c; text-transform:uppercase;">Active Layer: RC Condo Rate</div>
              <div style="font-size:17px; font-weight:800; color:#9a3412; margin-top:2px;">₱\${p.rcVal.toLocaleString()} / sqm</div>
              <div style="font-size:11px; color:\${isOfficial ? '#15803d' : '#64748b'}; font-weight:600; margin-top:2px;">\${isOfficial ? '✓ Official Building Schedule Rate' : '• Barangay Baseline (All Other Condos)'}</div>
            </div>
          \`;
        }
      } else if (mode === 'PS') {
        if (!p.psVal) {
          activeRateDisplay = \`
            <div style="background:#f1f5f9; border:1px solid #cbd5e1; padding:8px 10px; border-radius:6px; margin:8px 0;">
              <div style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase;">Active Layer: PS Parking Rate</div>
              <div style="font-size:15px; font-weight:800; color:#64748b; margin-top:2px;">Not Applicable (N/A)</div>
              <div style="font-size:11px; color:#475569; margin-top:2px;">No dedicated condominium parking slots recorded for this parcel.</div>
            </div>
          \`;
        } else {
          activeRateDisplay = \`
            <div style="background:#dcfce7; border:1px solid #86efac; padding:8px 10px; border-radius:6px; margin:8px 0;">
              <div style="font-size:11px; font-weight:700; color:#15803d; text-transform:uppercase;">Active Layer: PS Parking Rate</div>
              <div style="font-size:17px; font-weight:800; color:#166534; margin-top:2px;">₱\${p.psVal.toLocaleString()} / sqm</div>
              <div style="font-size:11px; color:#64748b; margin-top:2px;">Statutory 70% Unit Value Rule</div>
            </div>
          \`;
        }
      } else {
        if (p.isInstitutional) {
          activeRateDisplay = \`
            <div style="background:#f5f3ff; border:1px solid #c4b5fd; padding:8px 10px; border-radius:6px; margin:8px 0;">
              <span style="background:#7e22ce; color:white; font-size:10px; font-weight:700; padding:1px 6px; border-radius:4px;">\${p.instClass}</span>
              <strong style="color:#6b21a8; font-size:13px; margin-left:4px;">\${p.instType}</strong>
              <div style="font-size:11px; color:#475569; margin-top:4px;">\${p.instNote}</div>
              <div style="font-size:14px; font-weight:800; color:#581c87; margin-top:4px;">Assessment Base: ₱\${p.instVal.toLocaleString()} / sqm</div>
            </div>
          \`;
        } else {
          activeRateDisplay = \`
            <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:8px 10px; border-radius:6px; margin:8px 0; font-size:12px; color:#64748b;">
              <b>Classification:</b> \${p.primaryCode} (Standard Real Property)<br/>Non-institutional commercial or residential building.
            </div>
          \`;
        }
      }

      return \`
        <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.45; min-width: 290px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <strong style="font-size: 15px; color: #0f172a;">\${p.name}</strong>
            <span style="font-size: 11px; font-weight: 700; background: #e2e8f0; color: #334155; padding: 2px 6px; border-radius: 4px; white-space:nowrap;">\${p.primaryCode}</span>
          </div>
          <span style="color: #64748b; font-size: 12px;">\${p.street}, \${p.brgy}</span>
          \${activeRateDisplay}
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:6px 8px; margin-bottom:8px; font-size:11px;">
            <div style="font-weight:700; color:#334155; margin-bottom:2px;">Official BIR Excel Reference:</div>
            <div>• <strong>Schedule Name:</strong> \${p.exactBirName}</div>
            <div>• <strong>Vicinity:</strong> \${p.exactBirVicinity}</div>
            <div>• <strong>File &amp; Sheet:</strong> \${p.exactBirSheet} (Row \${p.exactBirRow})</div>
            <div>• <strong>Order &amp; RDO:</strong> \${p.exactBirOrder} &bull; \${p.exactBirRdo}</div>
          </div>
          <div style="font-size: 12px;">
            <b>All 6 Classification Rates:</b>
            <table style="width: 100%; font-size: 11px; border-collapse: collapse; margin-top: 4px;">
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 0;"><b>CR</b> Commercial Regular:</td><td style="text-align: right; font-weight: 700; color: #7e22ce;">₱\${p.crVal.toLocaleString()} / sqm</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 0;"><b>CC</b> Commercial Condo:</td><td style="text-align: right; font-weight: 700; color: \${p.ccVal ? '#2563eb' : '#94a3b8'};">\${p.ccVal ? '₱' + p.ccVal.toLocaleString() + ' / sqm' : 'N/A'}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 0;"><b>RR</b> Residential Regular:</td><td style="text-align: right; font-weight: 700; color: #b91c1c;">₱\${p.rrVal.toLocaleString()} / sqm</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 0;"><b>RC</b> Residential Condo:</td><td style="text-align: right; font-weight: 700; color: \${p.rcVal ? '#ea580c' : '#94a3b8'};">\${p.rcVal ? '₱' + p.rcVal.toLocaleString() + ' / sqm' : 'N/A'}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 0;"><b>PS</b> Parking Slot:</td><td style="text-align: right; font-weight: 700; color: \${p.psVal ? '#15803d' : '#94a3b8'};">\${p.psVal ? '₱' + p.psVal.toLocaleString() + ' / sqm' : 'N/A'}</td></tr>
              <tr><td style="padding: 3px 0;"><b>X/GL</b> Institutional/Gov:</td><td style="text-align: right; font-weight: 700; color: #4338ca;">\${p.isInstitutional ? p.instType.split(' ')[0] : 'Standard Taxable'}</td></tr>
            </table>
          </div>
        </div>
      \`;
    }

    const propertyPolygons = [];
    const polygonGroup = L.featureGroup().addTo(map);

    properties.forEach(p => {
      const style = getPropertyStyle(p, currentLayerMode);
      const poly = L.polygon(p.geom, style);
      poly.propertyData = p;
      poly.bindPopup(() => getPopupHtml(poly.propertyData, currentLayerMode));

      poly.on('click', function(e) {
        if (!isPropertyApplicable(this.propertyData, currentLayerMode)) {
          if (e.originalEvent) { e.originalEvent.preventDefault(); e.originalEvent.stopPropagation(); }
          this.closePopup();
          return;
        }
      });
      poly.on('mouseover', function() {
        if (!isPropertyApplicable(this.propertyData, currentLayerMode)) return;
        this.setStyle({ weight: 2.5, color: '#000000', fillOpacity: 0.95 });
      });
      poly.on('mouseout', function() {
        if (!isPropertyApplicable(this.propertyData, currentLayerMode)) return;
        const s = getPropertyStyle(this.propertyData, currentLayerMode);
        this.setStyle(s);
        applyPolygonInteractivity(this, currentLayerMode);
      });

      propertyPolygons.push(poly);
      polygonGroup.addLayer(poly);
    });

    function refreshInteractivity() {
      propertyPolygons.forEach(poly => { applyPolygonInteractivity(poly, currentLayerMode); });
    }
    setTimeout(refreshInteractivity, 100);
    map.on('zoomend moveend', refreshInteractivity);

    function updateActiveLayer(mode) {
      currentLayerMode = mode;
      document.querySelectorAll('.layer-radio-row').forEach(row => row.classList.remove('active'));
      const activeRow = document.getElementById('row-' + mode);
      if (activeRow) activeRow.classList.add('active');

      propertyPolygons.forEach(poly => {
        const s = getPropertyStyle(poly.propertyData, currentLayerMode);
        poly.setStyle(s);
        applyPolygonInteractivity(poly, currentLayerMode);
        const applicable = isPropertyApplicable(poly.propertyData, currentLayerMode);
        if (!applicable && poly.isPopupOpen && poly.isPopupOpen()) {
          poly.closePopup();
        } else if (poly.isPopupOpen && poly.isPopupOpen()) {
          poly.setPopupContent(getPopupHtml(poly.propertyData, currentLayerMode));
        }
      });

      renderRateHud(mode);
      renderActiveLayerSummary(mode);
      renderDirectoryRows();
    }

    let isRateHudCollapsed = false;
    function toggleRateHud() {
      isRateHudCollapsed = !isRateHudCollapsed;
      const body = document.getElementById('rate-hud-body');
      const btn = document.getElementById('rate-hud-toggle-btn');
      if (isRateHudCollapsed) {
        body.style.display = 'none';
        btn.innerHTML = 'Expand &plus;';
      } else {
        body.style.display = 'flex';
        btn.innerHTML = 'Collapse &minus;';
      }
    }

    function renderRateHud(mode) {
      const badge = document.getElementById('rate-hud-badge');
      const heading = document.getElementById('rate-hud-heading');
      const grad = document.getElementById('rate-hud-gradient');
      const tiers = document.getElementById('rate-hud-tiers');
      badge.className = 'rate-hud-pill pill-' + mode.toLowerCase();

      if (mode === 'CR') {
        badge.textContent = 'CR';
        heading.textContent = 'Commercial Regular (Land)';
        grad.style.background = 'linear-gradient(to right, #0d9488, #0284c7, #2563eb, #7e22ce)';
        tiers.innerHTML = \`
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#7e22ce;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱315,000 – ₱325,000 / sqm</span></div><div class="rate-tier-desc">ADB Ave, Julia Vargas, San Miguel, Meralco Ave</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#2563eb;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱280,000 – ₱290,000 / sqm</span></div><div class="rate-tier-desc">Emerald, Garnet, Sapphire, Ruby, Shaw, Ortigas Ave</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#0284c7;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱240,000 – ₱250,000 / sqm</span></div><div class="rate-tier-desc">Pearl Drive, Gold Loop, Mandaluyong ADB, QC Galleria</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#0d9488;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱140,000 – ₱217,000 / sqm</span></div><div class="rate-tier-desc">Escriva, Lourdes, Amethyst, Mandaluyong internal, QC EDSA</div></div></div>
          <div class="rate-tier-na"><div class="rate-tier-val"><span>✓ 100% Taxable Baseline Coverage</span></div><div class="rate-tier-desc">All commercial lots in Ortigas Center have active CR rates.</div></div>
        \`;
      } else if (mode === 'CC') {
        badge.textContent = 'CC';
        heading.textContent = 'Commercial Condos (Offices)';
        grad.style.background = 'linear-gradient(to right, #10b981, #06b6d4, #2563eb, #581c87)';
        tiers.innerHTML = \`
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#581c87;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱240,000 – ₱315,000 / sqm</span></div><div class="rate-tier-desc">Galleon Offices (₱315k), Spectrum (₱294k), Sapphire Bloc (₱270k)</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#2563eb;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱150,000 – ₱205,000 / sqm</span></div><div class="rate-tier-desc">St. Francis Shangri-La (₱189k), Corp Finance, Discovery, Jollibee</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#06b6d4;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱136,000 – ₱149,000 / sqm</span></div><div class="rate-tier-desc">Equitable, Prestige, Taipan, Tektite (₱141k), Wynsum, Strata</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#10b981;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱110,000 – ₱135,000 / sqm</span></div><div class="rate-tier-desc">San Antonio Base (₱123k), BSA Twin, Greenhills, Shaw Tower</div></div></div>
          <div class="rate-tier-na"><div class="rate-tier-val"><span style="color:#64748b;">Grey = N/A (Unclickable)</span></div><div class="rate-tier-desc">Pure residential condos or shopping malls with no office condo units.</div></div>
        \`;
      } else if (mode === 'RR') {
        badge.textContent = 'RR';
        heading.textContent = 'Residential Regular (Land)';
        grad.style.background = 'linear-gradient(to right, #65a30d, #ca8a04, #d97706, #ea580c, #b91c1c)';
        tiers.innerHTML = \`
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#b91c1c;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱200,000 / sqm</span></div><div class="rate-tier-desc">EDSA Mandaluyong Residential Corridor</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#ea580c;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱147,000 / sqm</span></div><div class="rate-tier-desc">Ortigas Avenue Mandaluyong Side</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#d97706;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱120,000 – ₱126,000 / sqm</span></div><div class="rate-tier-desc">Mandaluyong Internal (ADB, Julia Vargas, Shaw, Wack-Wack)</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#ca8a04;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱110,000 / sqm</span></div><div class="rate-tier-desc">QC Ugong Norte / Corinthian Gardens</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#65a30d;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱100,000 / sqm</span></div><div class="rate-tier-desc">Pasig San Antonio Residential Base (ADB, Emerald, Pearl)</div></div></div>
        \`;
      } else if (mode === 'RC') {
        badge.textContent = 'RC';
        heading.textContent = 'Residential Condos (Units)';
        grad.style.background = 'linear-gradient(to right, #84cc16, #eab308, #ea580c, #991b1b)';
        tiers.innerHTML = \`
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#991b1b;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱225,000 – ₱275,000 / sqm</span></div><div class="rate-tier-desc">Galleon Residences (₱275k), Spectrum (₱245k), Sapphire Bloc (₱225k)</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#ea580c;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱160,000 – ₱205,000 / sqm</span></div><div class="rate-tier-desc">One Shangri-La (₱179k), St. Francis Shangri-La (₱168k), Grand Midori, Currency</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#eab308;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱120,000 – ₱159,000 / sqm</span></div><div class="rate-tier-desc">Millenium, Malayan, Medical Plaza, Belvedere, Horizon, Mega Plaza</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#84cc16;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱100,000 – ₱119,000 / sqm</span></div><div class="rate-tier-desc">Sonata (₱126k), BSA Twin, San Antonio Base (₱103k), Cedar Mansion</div></div></div>
          <div class="rate-tier-na"><div class="rate-tier-val"><span style="color:#64748b;">Grey = N/A (Unclickable)</span></div><div class="rate-tier-desc">Pure commercial office towers or malls (e.g. Megamall, Tektite) with no dwelling units.</div></div>
        \`;
      } else if (mode === 'PS') {
        badge.textContent = 'PS';
        heading.textContent = 'Parking Slots (70% Rule)';
        grad.style.background = 'linear-gradient(to right, #34d399, #10b981, #059669, #064e3b)';
        tiers.innerHTML = \`
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#064e3b;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱180,000 – ₱220,500 / sqm</span></div><div class="rate-tier-desc">Galleon Offices (₱220.5k), Spectrum (₱205.8k), Sapphire (₱189k)</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#059669;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱113,000 – ₱159,600 / sqm</span></div><div class="rate-tier-desc">One Shangri-La (₱125k), St. Francis (₱118k), Midori, Currency</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#10b981;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱90,000 – ₱112,000 / sqm</span></div><div class="rate-tier-desc">Tektite (₱98.7k), Taipan (₱99.4k), Prestige, Equitable, Strata</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#34d399;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>₱65,000 – ₱89,000 / sqm</span></div><div class="rate-tier-desc">San Antonio Base (₱86.1k), Sonata, BSA Twin, Shaw Tower (₱67k)</div></div></div>
          <div class="rate-tier-na"><div class="rate-tier-val"><span style="color:#64748b;">Grey = N/A (Unclickable)</span></div><div class="rate-tier-desc">Parcels without separate condominium parking schedules.</div></div>
        \`;
      } else {
        badge.textContent = 'X / GL';
        heading.textContent = 'Institutional & Gov Land';
        grad.style.background = 'linear-gradient(to right, #9333ea, #2563eb)';
        tiers.innerHTML = \`
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#9333ea; border:2px solid #581c87;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>Institutional (X)</span></div><div class="rate-tier-desc">ADB HQ, UA&amp;P Campus, Poveda College, EDSA Shrine, Meralco Substation</div></div></div>
          <div class="rate-tier-row"><span class="rate-tier-swatch" style="background:#2563eb; border:2px solid #1e3a8a;"></span><div class="rate-tier-info"><div class="rate-tier-val"><span>Government Land (GL)</span></div><div class="rate-tier-desc">DepEd Regional Complex, Brgy San Antonio Hall, Police &amp; Fire Stations</div></div></div>
          <div class="rate-tier-na"><div class="rate-tier-val"><span style="color:#64748b;">Grey = Standard Real Property (Unclickable)</span></div><div class="rate-tier-desc">Commercial and residential parcels are not institutional and unclickable in this layer.</div></div>
        \`;
      }
    }

    function renderActiveLayerSummary(mode) {
      const box = document.getElementById('layer-summary-box');
      if (mode === 'CR') box.innerHTML = '<strong>Commercial Regular (CR)</strong> covers raw land/lot valuations along commercial streets. Rates range from ₱140k up to ₱325k / sqm on major thoroughfares (ADB Ave, San Miguel, Julia Vargas).';
      else if (mode === 'CC') box.innerHTML = '<strong>Commercial Condominium (CC)</strong> values individual office units in commercial towers. Rates range from ₱110k up to ₱315k / sqm (Offices at The Galleon). Pure residential parcels are greyed out and unclickable.';
      else if (mode === 'RR') box.innerHTML = '<strong>Residential Regular (RR)</strong> applies to residential lot parcels. Ranges from ₱100k / sqm in Pasig San Antonio to ₱200k / sqm along the EDSA Mandaluyong corridor.';
      else if (mode === 'RC') box.innerHTML = '<strong>Residential Condominium (RC)</strong> applies to living dwelling units in towers. Rates range from ₱100k up to ₱275k / sqm (Residences at The Galleon). Pure commercial buildings (e.g. Megamall, Tektite) are greyed out and unclickable.';
      else if (mode === 'PS') box.innerHTML = '<strong>Parking Slot (PS)</strong> represents parking spaces assessed at the BIR statutory 70% rule of unit value. Rates range from ₱65k to ₱220.5k / sqm.';
      else box.innerHTML = '<strong>Institutional &amp; Government (X / GL)</strong> highlights public, religious, diplomatic, and educational infrastructure. Standard private parcels are greyed out and unclickable.';
    }

    const dirTbody = document.getElementById('directory-tbody');
    const colHeader = document.getElementById('col-rate-header');
    const calcSelect = document.getElementById('calc-property');

    function renderDirectoryRows() {
      let colName = 'CR Rate';
      if (currentLayerMode === 'CC') colName = 'CC Rate';
      else if (currentLayerMode === 'RR') colName = 'RR Rate';
      else if (currentLayerMode === 'RC') colName = 'RC Rate';
      else if (currentLayerMode === 'PS') colName = 'PS Rate';
      else if (currentLayerMode === 'INST') colName = 'Classification';
      colHeader.textContent = colName;
      dirTbody.innerHTML = '';
      
      properties.forEach(p => {
        let valDisplay = '', cellColor = '#0f172a';
        if (currentLayerMode === 'CR') { valDisplay = '₱' + p.crVal.toLocaleString(); cellColor = '#7e22ce'; }
        else if (currentLayerMode === 'CC') { valDisplay = p.ccVal ? '₱' + p.ccVal.toLocaleString() : 'N/A'; cellColor = p.ccVal ? '#2563eb' : '#94a3b8'; }
        else if (currentLayerMode === 'RR') { valDisplay = '₱' + p.rrVal.toLocaleString(); cellColor = '#b91c1c'; }
        else if (currentLayerMode === 'RC') { valDisplay = p.rcVal ? '₱' + p.rcVal.toLocaleString() : 'N/A'; cellColor = p.rcVal ? '#ea580c' : '#94a3b8'; }
        else if (currentLayerMode === 'PS') { valDisplay = p.psVal ? '₱' + p.psVal.toLocaleString() : 'N/A'; cellColor = p.psVal ? '#15803d' : '#94a3b8'; }
        else { valDisplay = p.isInstitutional ? p.instClass + ' (' + p.instType.split(' ')[0] + ')' : p.primaryCode; cellColor = p.isInstitutional ? '#9333ea' : '#64748b'; }

        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td><strong>\${p.name}</strong><br/><span style="color: #64748b; font-size: 0.70rem;">\${p.street}, \${p.brgy}</span></td>
          <td><span style="font-size: 0.70rem; font-weight:600; color: #475569;">Row \${p.exactBirRow}</span><br/><span style="font-size: 0.65rem; color: #94a3b8;">\${p.exactBirSheet.split(' ')[0]}</span></td>
          <td style="text-align: right; font-weight: 700; color: \${cellColor};">\${valDisplay}</td>
        \`;
        tr.onclick = () => focusProperty(p);
        dirTbody.appendChild(tr);
      });
    }

    function populateCalculatorDropdown() {
      calcSelect.innerHTML = '';
      properties.forEach(p => {
        const opt = document.createElement('option');
        opt.value = JSON.stringify(p);
        opt.textContent = \`\${p.name} (\${p.street} - \${p.brgy})\`;
        calcSelect.appendChild(opt);
      });
    }

    function filterDirectory() {
      const q = document.getElementById('dir-filter').value.toLowerCase();
      const rows = dirTbody.querySelectorAll('tr');
      rows.forEach(r => {
        const text = r.textContent.toLowerCase();
        r.style.display = text.includes(q) ? '' : 'none';
      });
    }

    function quickJump(term) {
      document.getElementById('dir-filter').value = term;
      filterDirectory();
      const match = properties.find(p => p.name.toLowerCase().includes(term.toLowerCase()) || (p.exactBirName && p.exactBirName.toLowerCase().includes(term.toLowerCase())));
      if (match) focusProperty(match);
    }

    function focusProperty(p) {
      map.setView(p.center, 18);
      const targetPoly = propertyPolygons.find(poly => poly.propertyData.id === p.id);
      if (targetPoly) {
        targetPoly.openPopup();
        targetPoly.setStyle({ weight: 3, color: '#000000', fillOpacity: 0.95 });
        setTimeout(() => {
          const s = getPropertyStyle(targetPoly.propertyData, currentLayerMode);
          targetPoly.setStyle(s);
          applyPolygonInteractivity(targetPoly, currentLayerMode);
        }, 3000);
      }
    }

    function runTaxCalc() {
      const p = JSON.parse(document.getElementById('calc-property').value);
      const type = document.getElementById('calc-type').value;
      const area = parseFloat(document.getElementById('calc-area').value) || 0;

      let rate = p.ccVal, isFallback = false;
      if (type === 'CR') rate = p.crVal;
      else if (type === 'CC') { rate = p.ccVal; if (rate === null) { rate = p.crVal; isFallback = true; } }
      else if (type === 'RR') rate = p.rrVal;
      else if (type === 'RC') { rate = p.rcVal; if (rate === null) { rate = p.crVal; isFallback = true; } }
      else if (type === 'PS') { rate = p.psVal; if (rate === null) { rate = Math.round(p.crVal * 0.7); isFallback = true; } }

      const totalZonal = rate * area;
      const cgt = totalZonal * 0.06;
      const dst = totalZonal * 0.015;
      const ltt = totalZonal * 0.0075;
      const grandTax = cgt + dst + ltt;

      document.getElementById('res-rate').textContent = (isFallback ? 'N/A (CR Base: ' : '') + '₱' + rate.toLocaleString() + ' / sqm' + (isFallback ? ')' : '');
      document.getElementById('res-rdo').textContent = p.exactBirSheet + ' (Row ' + p.exactBirRow + ')';
      document.getElementById('res-total').textContent = '₱' + Math.round(totalZonal).toLocaleString();
      document.getElementById('res-cgt').textContent = '₱' + Math.round(cgt).toLocaleString();
      document.getElementById('res-dst').textContent = '₱' + Math.round(dst).toLocaleString();
      document.getElementById('res-ltt').textContent = '₱' + Math.round(ltt).toLocaleString();
      document.getElementById('res-grand-tax').textContent = '₱' + Math.round(grandTax).toLocaleString();
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      const tabs = ['tab-layers', 'tab-directory', 'tab-calculator', 'tab-audit'];
      const idx = tabs.indexOf(tabId);
      document.querySelectorAll('.tab-btn')[idx].classList.add('active');
      document.getElementById(tabId).classList.add('active');
    }

    document.getElementById('chk-cbd').addEventListener('change', e => { if (e.target.checked) map.addLayer(cbdLayer); else map.removeLayer(cbdLayer); });
    document.getElementById('chk-sa').addEventListener('change', e => { if (e.target.checked) map.addLayer(saLayer); else map.removeLayer(saLayer); });
    document.getElementById('chk-bbox').addEventListener('change', e => { if (e.target.checked) map.addLayer(bboxLayer); else map.removeLayer(bboxLayer); });

    function fitCbd() { map.fitBounds(cbdLayer.getBounds(), { padding: [40, 40] }); }

    renderRateHud('CR');
    renderActiveLayerSummary('CR');
    renderDirectoryRows();
    populateCalculatorDropdown();
    runTaxCalc();
  </script>
</body>
</html>`;

const outPath = path.join(baseDir, 'index.html');
fs.writeFileSync(outPath, pageContent, 'utf8');
console.log(`[SUCCESS] Generated production map at ${outPath}`);
