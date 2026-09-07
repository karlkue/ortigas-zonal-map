# Ortigas Center Zonal Valuation Dataset

This directory contains the cleaned, reconciled, and spatially matched Bureau of Internal Revenue (BIR) Zonal Valuation dataset for **Ortigas Center**, Metro Manila.

---

## 1. Geographic Scope

Ortigas Center is a tri-city Central Business District (CBD) spanning three local government units (LGUs). To ensure 100% tax fidelity, this dataset strictly confines valuations to the exact statutory barangays comprising Ortigas Center:

| LGU / City | BIR RDO | Zone / Barangay | Department Order (DO) | Sheet & Effective Date |
| :--- | :--- | :--- | :--- | :--- |
| **Mandaluyong City** | **RDO 41** | `WACK-WACK - GREENHILLS EAST` | **D.O. 059-2022** (8th Rev) | Sheet 9 • Sep 22, 2022 |
| **Pasig City** | **RDO 43** | `SAN ANTONIO` | **D.O. 024-2023** (7th Rev) | Sheet 9 • Jun 02, 2023 |
| **Quezon City** | **RDO 40 (Cubao)** | `UGONG NORTE` | **D.O. 021-2020** (7th Rev) | Sheet 7 • Aug 18, 2020 |

> **Note on Boundary Filtering:**  
> All other barangays (such as Plainview, Highway Hills, Kapitolyo, Oranbo, Ugong Pasig, Bagumbayan, etc.) have been strictly excluded to prevent accidental cross-zonal rate pollution.

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
  The complete geo-spatial dataset consumed by the map application. Contains 102 individual polygons (97 building footprints and 5 synthetic/compound area blocks) with their resolved rates, address, coordinates, and exact BIR schedule references.
- **`official_bir_parsed_all.json`**:  
  The raw tabular extraction of every BIR schedule entry for the 3 target barangays (streets, vicinities, named condominiums, and classifications) directly parsed from the official BIR XLS workbooks.
- **`boundaries.json`**:  
  GeoJSON coordinates for the Ortigas Center perimeter boundary (128-point polygon) and the San Antonio Pasig sub-boundary (38-point polygon).

---

## 4. Schema: `final_reconciled_properties.json`

Each record in `final_reconciled_properties.json` represents a physical building footprint or boundary polygon:

```json
{
  "id": "osm-way-12345678",
  "name": "The St. Francis Shangri-La Place (Tower 1)",
  "classification": "RC / CC",
  "rates": {
    "CR": 200000,
    "CC": 189000,
    "RR": 120000,
    "RC": 168000,
    "PS": 118000,
    "X": "Standard Taxable"
  },
  "isOfficial": {
    "CR": false,
    "CC": true,
    "RR": false,
    "RC": true,
    "PS": true
  },
  "officialScheduleRef": {
    "name": "ST. FRANCIS SHANGRI-LA PLACE",
    "vicinity": "SAN MIGUEL AVE.",
    "sheet": "Sheet 9 (DO 059-2022)",
    "rdo": "RDO 41 (Mandaluyong)",
    "order": "D.O. 059-2022",
    "row": 1500
  },
  "lat": 14.5815,
  "lon": 121.0568,
  "address": "St. Francis Street, Wack-Wack - Greenhills East, Mandaluyong City",
  "polygon": [
    [14.5816, 121.0566],
    [14.5817, 121.0570],
    ...
  ]
}
```

### Key Properties:
- **`rates`**: Values in Philippine Pesos (PHP) per square meter. If a specific rate is not applicable or unassigned, it is `null`.
- **`isOfficial`**: Boolean map indicating whether a rate originates from an **explicit building schedule** in the BIR revision (`true`), or if it falls back to the **statutory street/barangay baseline** (`false`).
- **`officialScheduleRef`**: Full provenance trail tracking the exact line item, sheet name, Department Order, and row number in the BIR Excel file.

---

## 5. How to Use this Data

### Python Example: Load and Analyze Rates

```python
import json

with open("data/ortigas/final_reconciled_properties.json", "r", encoding="utf-8") as f:
    properties = json.load(f)

print(f"Total properties: {len(properties)}")

# Filter properties with official RC (Residential Condo) rates
rc_condos = [
    p for p in properties 
    if p["rates"].get("RC") and p["isOfficial"].get("RC")
]

print(f"Named condos with official BIR RC rates: {len(rc_condos)}")
for condo in sorted(rc_condos, key=lambda x: x["rates"]["RC"], reverse=True)[:5]:
    print(f"- {condo['name']}: ₱{condo['rates']['RC']:,}/sqm ({condo['officialScheduleRef']['order']})")
```

### JavaScript / Node.js Example:

```javascript
const fs = require('fs');

const properties = JSON.parse(
  fs.readFileSync('data/ortigas/final_reconciled_properties.json', 'utf8')
);

// Calculate average Commercial Condo (CC) rate across Ortigas Center
const ccProperties = properties.filter(p => p.rates.CC !== null);
const avgCC = ccProperties.reduce((sum, p) => sum + p.rates.CC, 0) / ccProperties.length;

console.log(`Average CC Rate: ₱${Math.round(avgCC).toLocaleString()}/sqm across ${ccProperties.length} buildings.`);
```
