# Ortigas Center & Highway Hills Zonal Valuation Dataset

This directory contains the cleaned, reconciled, and spatially matched Bureau of Internal Revenue (BIR) Zonal Valuation dataset for **Ortigas Center** and the contiguous **Barangay Highway Hills** (Greenfield District / EDSA-Shaw corridor), Metro Manila.

---

## 1. Geographic Scope

The dataset covers the tri-city Central Business District (CBD) and the directly adjacent commercial/condominium corridor of Barangay Highway Hills across four statutory zones:

| LGU / City | BIR RDO | Zone / Barangay | Department Order (DO) | Sheet & Effective Date |
| :--- | :--- | :--- | :--- | :--- |
| **Mandaluyong City** | **RDO 41** | `WACK-WACK - GREENHILLS EAST` | **D.O. 059-2022** (8th Rev) | Sheet 9 • Sep 22, 2022 |
| **Mandaluyong City** | **RDO 41** | `HIGHWAY HILLS` | **D.O. 059-2022** (8th Rev) | Sheet 9 • Sep 22, 2022 |
| **Pasig City** | **RDO 43** | `SAN ANTONIO` | **D.O. 024-2023** (7th Rev) | Sheet 9 • Jun 02, 2023 |
| **Quezon City** | **RDO 40 (Cubao)** | `UGONG NORTE` | **D.O. 021-2020** (7th Rev) | Sheet 7 • Aug 18, 2020 |

> **Contiguous Corridor Note:**  
> Barangay Highway Hills sits directly across Shaw Boulevard and EDSA from Ortigas Center, housing major developments such as the Greenfield District (Twin Oaks Place, Zitan, Soho Central, The Portal), Fame Residences, Avida Towers Centera, Grand Central Residences, Lancaster Suites, and California Garden Square.

---

## 2. BIR Classification Legend

The BIR classifies real property under standard codes. Each parcel or condominium unit in this dataset possesses distinct rates across these six classifications:

| Code | Classification | Description & Real-World Application |
| :---: | :--- | :--- |
| **CR** | **Commercial Regular** | Raw commercial land / lot valuation per square meter. Used for commercial lots, open developments, and standalone commercial buildings. |
| **CC** | **Commercial Condo** | Commercial condominium units (office spaces, retail units, commercial suites within towers). |
| **RR** | **Residential Regular** | Residential lot valuation per square meter (e.g., residential compounds, townhouses on land). |
| **RC** | **Residential Condo** | Residential condominium units (apartments, high-rise living units). |
| **PS** | **Parking Slot** | Dedicated condominium or commercial parking slots (typically priced per square meter or standardized slot rate). |
| **X / GL** | **Institutional / Gov** | Properties classified as institutional, religious, educational, government-owned, or non-profit exempt. Taxable under special provisions. |

---

## 3. Files in this Directory

- **`final_reconciled_properties.json`**:  
  The complete geo-spatial dataset consumed by the map application. Contains 739 properties across Ortigas Center and Barangay Highway Hills with their resolved rates, address, coordinates, and exact BIR schedule references.
- **`official_bir_parsed_all.json`**:  
  The raw tabular extraction of 553 BIR schedule entries across all four target barangays directly parsed from the official BIR XLS workbooks.
- **`boundaries.json`**:  
  GeoJSON coordinates for:
  - Ortigas Center perimeter boundary (128-point loop)
  - Barangay Highway Hills boundary (127-point loop, OSM relation `104445`)
  - Barangay San Antonio sub-boundary (38-point loop)
  - Combined bounding box envelope

---

## 4. Schema: `final_reconciled_properties.json`

Each record in `final_reconciled_properties.json` represents a physical building footprint or boundary polygon:

```json
{
  "id": "osm-way-12345678",
  "name": "Twin Oaks Place (Tower 1)",
  "matchedBirName": "TWIN OAKS PLACE",
  "street": "SHAW BLVD - GREENFIELD DISTRICT",
  "brgy": "Highway Hills",
  "rdo": "RDO 41 (Mandaluyong)",
  "do": "D.O. 059-2022",
  "class": "RC",
  "primaryCode": "RC",
  "crVal": 100000.0,
  "ccVal": 70000.0,
  "ccStatus": "Barangay Baseline (All Other Condos)",
  "rrVal": 48000.0,
  "rcVal": 158000.0,
  "rcStatus": "Official Building Rate",
  "psVal": 111000.0,
  "exactBirName": "TWIN OAKS PLACE",
  "exactBirVicinity": "SHAW BLVD - GREENFIELD DISTRICT",
  "exactBirSheet": "Sheet 9 (DO 059-2022)",
  "exactBirOrder": "D.O. 059-2022",
  "exactBirRdo": "RDO 41 (Mandaluyong)",
  "exactBirRow": 824,
  "center": [14.5788, 121.0558],
  "geom": [
    [14.5788, 121.0558],
    ...
  ]
}
```

---

## 5. How to Use this Data

### Python Example: Load and Analyze Rates

```python
import json

with open("data/ortigas/final_reconciled_properties.json", "r", encoding="utf-8") as f:
    properties = json.load(f)

print(f"Total properties: {len(properties)}")

# Filter properties with official RC (Residential Condo) rates in Highway Hills
hh_condos = [
    p for p in properties 
    if p["brgy"] == "Highway Hills" and p.get("rcStatus") == "Official Building Rate"
]

print(f"Named Highway Hills condos with official BIR RC rates: {len(hh_condos)}")
for condo in sorted(hh_condos, key=lambda x: x["rcVal"], reverse=True)[:5]:
    print(f"- {condo['name']}: ₱{condo['rcVal']:,}/sqm (Row {condo['exactBirRow']})")
```
