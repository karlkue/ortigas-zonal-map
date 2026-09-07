# Ortigas Center BIR Zonal Value Map

[![Live Demo](https://img.shields.io/badge/Live%20Map-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://karlkue.github.io/ortigas-zonal-map/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

An interactive, polygon-accurate GIS property map of the **Ortigas Center Central Business District (CBD)**, mapped directly to official Bureau of Internal Revenue (BIR) Zonal Valuation schedules across all **6 property classifications**.

🌐 **Explore the Live Map:**  
👉 **[https://karlkue.github.io/ortigas-zonal-map/](https://karlkue.github.io/ortigas-zonal-map/)**

---

## 🌟 Features

- **Strict 3-Barangay Purist Model**: Excludes non-CBD neighborhoods to guarantee zero rate pollution.
- **6 Dedicated Valuation Layers**:
  - `CR` — Commercial Regular (Raw commercial land per sqm)
  - `CC` — Commercial Condo (Office & commercial units per sqm)
  - `RR` — Residential Regular (Residential land per sqm)
  - `RC` — Residential Condo (High-rise residential units per sqm)
  - `PS` — Parking Slot (Vehicle parking spaces per sqm)
  - `X / GL` — Institutional & Government (Taxable & exempt institutions)
- **Official Schedule Citations**: Inspect any parcel to view its exact BIR Department Order, RDO, Sheet name, and Row number.
- **Distinction Between Specific vs Baseline Rates**: Clear UI indicators for whether a building has an explicit schedule line item or falls back to the statutory street/barangay baseline.
- **Context-Aware UX**: Non-applicable parcels are greyed out and made unclickable for the active layer.
- **Instant Search & Real-Time Filter**: Search across all named towers, corporate headquarters, and commercial centers.
- **Transfer Tax Estimator**: Real-time tax calculator for Capital Gains Tax (CGT 6%), Documentary Stamp Tax (DST 1.5%), and Local Transfer Tax (~0.75%).

---

## 🏛️ Statutory Sources & Jurisdictions

| LGU / City | BIR RDO | Zone / Barangay | Department Order (DO) | Sheet & Effective Date |
| :--- | :--- | :--- | :--- | :--- |
| **Mandaluyong City** | **RDO 41** | `WACK-WACK - GREENHILLS EAST` | **D.O. 059-2022** (8th Rev) | Sheet 9 • Sep 22, 2022 |
| **Pasig City** | **RDO 43** | `SAN ANTONIO` | **D.O. 024-2023** (7th Rev) | Sheet 9 • Jun 02, 2023 |
| **Quezon City** | **RDO 40 (Cubao)** | `UGONG NORTE` | **D.O. 021-2020** (7th Rev) | Sheet 7 • Aug 18, 2020 |

---

## 📁 Repository Structure

```
.
├── index.html                           # Standalone client-side GIS web application
├── PLAYBOOK.md                          # Master guide to replicate for ANY Philippine CBD
├── README.md                            # Project documentation
│
├── data/
│   ├── raw/                             # Raw data dumps
│   │   ├── bir_excels/                  # Official BIR Excel workbooks (.xls)
│   │   │   ├── RDO No. 41 - Mandaluyong City.xls
│   │   │   ├── RDO No. 43 - Pasig City.xls
│   │   │   └── RDO No. 40 - Cubao.xls
│   │   └── osm/                         # Raw OpenStreetMap building geometry dump
│   │       └── ortigas_osm_buildings_raw.json
│   │
│   └── ortigas/                         # Reconciled Ortigas Center dataset
│       ├── README.md                    # Data dictionary & usage instructions
│       ├── boundaries.json              # GeoJSON boundary coordinates (CBD & San Antonio)
│       ├── final_reconciled_properties.json  # Reconciled GIS + tax dataset
│       └── official_bir_parsed_all.json # Parsed tabular BIR schedule records
│
└── scripts/                             # End-to-end reproducible pipeline
    ├── 01_download_bir_excels.py        # Automated BIR XLS downloader
    ├── 02_fetch_osm_buildings.py        # Overpass API footprint extractor
    ├── 03_parse_bir_schedules.py        # Robust multi-line BIR XLS parser
    ├── 04_reconcile_and_match.py        # Spatial PIP & entity matching engine
    └── 05_build_map_html.js             # Compiles dataset into standalone index.html
```

---

## 📖 Replicating for Other CBDs

Want to build a similar map for **Bonifacio Global City (BGC)**, **Makati CBD**, **Eastwood City**, **Alabang / Filinvest**, or **Cebu IT Park**?

👉 Read our comprehensive **[PLAYBOOK.md](PLAYBOOK.md)** for:
- Step-by-step methodology for handling legacy BIR `.xls` workbooks.
- Overpass QL query templates for OpenStreetMap building footprints.
- Point-in-polygon spatial filtering and alias dictionaries.
- Complete parameter recipes for BGC, Makati, Eastwood, and Alabang.

---

## 🚀 Running the Pipeline Locally

### Prerequisites
- Python 3.8+ with `xlrd` and `requests`:
  ```bash
  pip install xlrd requests
  ```
- Node.js 16+ (for compiling `index.html`):
  ```bash
  node -v
  ```

### Step-by-Step Execution
```bash
# 1. (Optional) Download fresh BIR XLS files from BIR portal
python scripts/01_download_bir_excels.py

# 2. Extract OpenStreetMap building footprints for Ortigas Center
python scripts/02_fetch_osm_buildings.py

# 3. Parse tabular schedules from the 3 BIR workbooks
python scripts/03_parse_bir_schedules.py

# 4. Run spatial reconciliation and entity matching
python scripts/04_reconcile_and_match.py

# 5. Rebuild the standalone index.html web app
node scripts/05_build_map_html.js
```

---

## 📄 License
This project is open-source under the MIT License. Government zonal values are public statutory information published by the Bureau of Internal Revenue (Department of Finance, Republic of the Philippines). Map geometries are courtesy of [OpenStreetMap](https://www.openstreetmap.org) contributors.
