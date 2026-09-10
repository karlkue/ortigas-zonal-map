"""
Script: 04_reconcile_and_match.py
Purpose: Reconcile physical building footprints with official BIR Excel schedules
         using spatial partitioning and entity resolution across:
         1. Pasig City: San Antonio (D.O. 024-2023)
         2. Mandaluyong City: Wack-Wack - Greenhills East (D.O. 059-2022)
         3. Mandaluyong City: Highway Hills (D.O. 059-2022)
         4. Quezon City: Ugong Norte (D.O. 021-2020)
Output: data/ortigas/final_reconciled_properties.json (Matching exact index.html schema)
"""

import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORTIGAS_DIR = os.path.join(BASE_DIR, "data", "ortigas")
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
OUTPUT_FILE = os.path.join(ORTIGAS_DIR, "final_reconciled_properties.json")

def point_in_poly(lat, lon, poly):
    n = len(poly)
    inside = False
    p1lat, p1lon = poly[0]
    for i in range(n + 1):
        p2lat, p2lon = poly[i % n]
        if lon > min(p1lon, p2lon):
            if lon <= max(p1lon, p2lon):
                if lat <= max(p1lat, p2lat):
                    if p1lon != p2lon:
                        xinters = (lon - p1lon) * (p2lat - p1lat) / (p2lon - p1lon) + p1lat
                    if p1lat == p2lat or lat <= xinters:
                        inside = not inside
        p1lat, p1lon = p2lat, p2lon
    return inside

def run_reconciliation():
    with open(os.path.join(ORTIGAS_DIR, "boundaries.json"), "r", encoding="utf-8") as f:
        boundaries = json.load(f)
    with open(os.path.join(ORTIGAS_DIR, "official_bir_parsed_all.json"), "r", encoding="utf-8") as f:
        bir_parsed = json.load(f)
    with open(os.path.join(RAW_DIR, "osm", "highway_hills_osm_raw.json"), "r", encoding="utf-8") as f:
        hh_osm = json.load(f)

    # 1. Load existing base Ortigas properties (San Antonio, Wack-Wack, Ugong Norte)
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        existing_all = json.load(f)

    ortigas_properties = [p for p in existing_all if p.get("brgy") in ["San Antonio", "Wack-Wack - Greenhills East", "Ugong Norte"]]
    print(f"Preserved {len(ortigas_properties)} base Ortigas Center properties.")

    # 2. Index Highway Hills BIR schedules
    hh_records = bir_parsed.get("highway_hills", [])
    hh_condos = {}
    for r in hh_records:
        name_clean = r["name"].strip().upper()
        if name_clean not in hh_condos:
            hh_condos[name_clean] = {
                "name": r["name"].strip(),
                "vicinity": r["vicinity"].strip(),
                "row": r["row"],
                "sheet": "Sheet 9 (DO 059-2022)",
                "order": "D.O. 059-2022",
                "rdo": "RDO 41 (Mandaluyong)",
                "rates": {}
            }
        hh_condos[name_clean]["rates"][r["class"]] = r["value"]

    hh_perimeter = boundaries["barangayHighwayHillsPerimeter"]

    # Street Schedules for Highway Hills
    hh_street_schedules = [
        ({"match": ["edsa"]}, {"CR": 200000.0, "RR": 48000.0, "name": "EDSA", "vicinity": "SHAW BLVD - ARAYAT", "row": 692}),
        ({"match": ["shaw"]}, {"CR": 150000.0, "RR": 48000.0, "name": "SHAW BLVD", "vicinity": "OLD WACK-WACK - SHERIDAN", "row": 739}),
        ({"match": ["united"]}, {"CR": 105000.0, "RR": 48000.0, "name": "UNITED", "vicinity": "SHERIDAN-EDSA", "row": 747}),
        ({"match": ["pioneer"]}, {"CR": 100000.0, "RR": 48000.0, "name": "PIONEER", "vicinity": "SHERIDAN-PIONEER ST (PIONEER CREEK)", "row": 717}),
        ({"match": ["mayflower"]}, {"CR": 100000.0, "RR": 48000.0, "name": "MAYFLOWER", "vicinity": "SHAW BLVD-UNITED ST-RELIANCE", "row": 709}),
        ({"match": ["reliance"]}, {"CR": 100000.0, "RR": 48000.0, "name": "RELIANCE", "vicinity": "EDSA - PIONEER", "row": 720}),
        ({"match": ["sheridan"]}, {"CR": 100000.0, "RR": 48000.0, "name": "SHERIDAN", "vicinity": "SHAW BLVD. - PASIG RIVER", "row": 741}),
        ({"match": ["williams"]}, {"CR": 90000.0, "RR": 48000.0, "name": "WILLIAMS", "vicinity": "SHERIDAN - PIONEER", "row": 749}),
        ({"match": ["pines"]}, {"CR": 103000.0, "RR": 48000.0, "name": "PINES", "vicinity": "SHERIDAN - RELIANCE", "row": 715}),
        ({"match": ["samat"]}, {"CR": 75000.0, "RR": 60000.0, "name": "SAMAT", "vicinity": "SHAW BLVD-CALBAYOG", "row": 730}),
        ({"match": ["sierra madre"]}, {"CR": 65000.0, "RR": 50000.0, "name": "SIERRA MADRE", "vicinity": "DOMINGO M. GUEVARRA-SULTAN", "row": 726}),
        ({"match": ["old wack-wack", "old wack wack"]}, {"CR": 65000.0, "RR": 50000.0, "name": "OLD WACK-WACK ROAD", "vicinity": "NUEVE DE PEBRERO-SHAW BLVD", "row": 712}),
        ({"match": ["dm guevarra", "guevarra", "libertad"]}, {"CR": 54000.0, "RR": 42000.0, "name": "DM GUEVARRA (FORMERLY LIBERTAD)", "vicinity": "EDSA-CALBAYOG EXIT", "row": 701}),
        ({"match": ["esteban"]}, {"CR": 64000.0, "RR": 48000.0, "name": "ESTEBAN", "vicinity": "MOLINAO-SIERRA MADRE", "row": 693}),
        ({"match": ["road i", "road ii"]}, {"CR": 61000.0, "RR": 48000.0, "name": "ROAD I / ROAD II", "vicinity": "ARAYAT-CORDILLERA", "row": 722}),
        ({"match": ["sultan"]}, {"CR": 52000.0, "RR": 40000.0, "name": "SULTAN", "vicinity": "EDSA - MARIVELES", "row": 745}),
        ({"match": ["mariveles"]}, {"CR": 49000.0, "RR": 41000.0, "name": "MARIVELES", "vicinity": "SIERRA MADRE-KANLAUN", "row": 707})
    ]

    hh_aliases = [
        (["twin oaks place 1"], "TWIN OAKS PLACE"),
        (["twin oaks place 2"], "TWIN OAKS PLACE"),
        (["twin oaks"], "TWIN OAKS PLACE"),
        (["zitan"], "ZITAN"),
        (["soho central"], "SOHO CENTRAL PRIVATE RESIDENCES"),
        (["fame", "tower a", "tower b"], "FAME RESIDENCES (SMDC)"),
        (["centera", "avida towers -centera"], "AVIDA TOWERS -CENTERA"),
        (["grand central residences", "grand central"], "GRAND CENTRAL RESIDENCES"),
        (["lancaster suites tower 1", "lancaster suites tower 2", "lancaster suite"], "LANCASTER SUITE TOWER I"),
        (["summit one tower", "summit one", "palladium summit", "one summit"], "PALLADIUM SUMMIT (ONE SUMMIT)"),
        (["one sierra", "one sierra tower"], "ONE SIERRA TOWER*"),
        (["citynet central", "citynet"], "CITYNET CENTRAL*"),
        (["urban deca tower 8990", "urban deca tower", "urban deca"], "URBAN DECA TOWER"),
        (["anaheim", "burbank", "carlton", "dayton", "el dorado", "fairfax", "glenhaven", "hennessy", "california garden"], "CALIFORNIA GARDEN SQUARE"),
        (["diamond tower residences", "diamond residences"], "DIAMOND RESIDENCES"),
        (["ark condominium", "ark condo"], "ARK CONDOMINIUM"),
        (["facilities center", "facilities centre", "the facilities centre"], "FACILITIES CENTER"),
        (["sunshine garden condominium", "sunshine garden"], "SUNSHINE GARDEN CONDOMINIUM"),
        (["jovan", "jovan condominium"], "JOVAN CONDOMINIUM"),
        (["governors place", "governors place condo"], "GOVERNORS PLACE CONDO"),
        (["gueventville", "gueventville condominium"], "GUEVENTVILLE CONDOMINIUM"),
        (["sierra heights", "sierra heights place"], "SIERRA HEIGHTS PLACE")
    ]

    node_map = {el["id"]: (el["lat"], el["lon"]) for el in hh_osm.get("elements", []) if el.get("type") == "node"}
    hh_properties = []
    seen = set()

    for el in hh_osm.get("elements", []):
        if el.get("type") == "way" and "nodes" in el:
            coords = [node_map[nid] for nid in el["nodes"] if nid in node_map]
            if len(coords) < 3:
                continue
            alat = sum(c[0] for c in coords) / len(coords)
            alon = sum(c[1] for c in coords) / len(coords)

            if not point_in_poly(alat, alon, hh_perimeter):
                continue

            tags = el.get("tags", {})
            raw_name = tags.get("name", "").strip()
            levels = tags.get("building:levels", "")

            # Specific landmark labeling
            if el["id"] == 419618367:
                display_name = "Zitan Condominium"
            elif el["id"] == 103600689:
                display_name = "Fame Residences (Tower A)"
            elif el["id"] == 103600685:
                display_name = "Fame Residences (Tower B)"
            elif el["id"] == 1066848834:
                display_name = "Avida Towers Centera"
            elif el["id"] == 1063979375:
                display_name = "Twin Oaks Place (Tower 1)"
            elif el["id"] == 1063979366:
                display_name = "Twin Oaks Place (Tower 2)"
            elif raw_name:
                display_name = raw_name
            elif levels and int(levels) >= 8:
                display_name = f"Commercial Tower ({levels}F, Highway Hills)"
            else:
                continue

            key = (display_name, round(alat, 3), round(alon, 3))
            if key in seen:
                continue
            seen.add(key)

            matched_sched = None
            norm = display_name.lower()

            for aliases, target_bir in hh_aliases:
                if any(a in norm for a in aliases):
                    if target_bir in hh_condos:
                        matched_sched = hh_condos[target_bir]
                        break

            if not matched_sched:
                for bir_key, s_data in hh_condos.items():
                    if bir_key.lower() in norm or norm in bir_key.lower():
                        matched_sched = s_data
                        break

            matched_street = None
            for s_criteria, s_rates in hh_street_schedules:
                if any(m in norm for m in s_criteria["match"]):
                    matched_street = s_rates
                    break

            if not matched_street:
                if alon >= 121.052 and alat >= 14.578:
                    matched_street = hh_street_schedules[4][1] # Mayflower
                elif alon <= 121.048:
                    matched_street = hh_street_schedules[12][1] # DM Guevarra
                else:
                    matched_street = hh_street_schedules[10][1] # Sierra Madre

            crVal = matched_street.get("CR", 45000.0)
            rrVal = matched_street.get("RR", 34000.0)

            is_comm = any(k in norm for k in ["hotel", "mall", "market", "center", "centre", "corporate", "office", "plaza", "portal", "hub", "square", "teleperformance", "pavilion", "diy", "coffee", "showroom", "unilab", "warehouse"])
            is_inst = any(k in norm for k in ["church", "pamahalaan", "barangay", "division", "scouts", "fatima", "police", "fire"])

            if matched_sched:
                s_rates = matched_sched["rates"]
                rcVal = s_rates.get("RC", 56000.0)
                rcStatus = "Official Building Rate" if "RC" in s_rates else "Barangay Baseline (All Other Condos)"

                ccVal = s_rates.get("CC", s_rates.get("CR", 70000.0))
                ccStatus = "Official Building Rate" if ("CC" in s_rates or "CR" in s_rates) else "Barangay Baseline (All Other Condos)"

                psVal = s_rates.get("PS", round(rcVal * 0.7) if rcVal else 40000.0)

                primaryCode = "RC" if "RC" in s_rates else "CC"

                exactName = matched_sched["name"]
                exactVicinity = matched_sched["vicinity"]
                exactSheet = matched_sched["sheet"]
                exactOrder = matched_sched["order"]
                exactRdo = matched_sched["rdo"]
                exactRow = matched_sched["row"]
            else:
                exactName = matched_street["name"] + " Schedule"
                exactVicinity = matched_street["vicinity"]
                exactSheet = "Sheet 9 (DO 059-2022)"
                exactOrder = "D.O. 059-2022"
                exactRdo = "RDO 41 (Mandaluyong)"
                exactRow = matched_street["row"]

                if is_inst:
                    rcVal = None
                    rcStatus = "Not Applicable (N/A)"
                    ccVal = None
                    ccStatus = "Not Applicable (N/A)"
                    psVal = None
                    primaryCode = "X"
                elif is_comm:
                    rcVal = None
                    rcStatus = "Not Applicable (Commercial Facility)"
                    ccVal = 70000.0
                    ccStatus = "Barangay Baseline (All Other Condos)"
                    psVal = 40000.0
                    primaryCode = "CC"
                else:
                    rcVal = 56000.0
                    rcStatus = "Barangay Baseline (All Other Condos)"
                    ccVal = 70000.0
                    ccStatus = "Barangay Baseline (All Other Condos)"
                    psVal = 40000.0
                    primaryCode = "RC"

            prop_item = {
                "id": el["id"],
                "name": display_name,
                "matchedBirName": exactName,
                "street": matched_street["name"],
                "brgy": "Highway Hills",
                "rdo": "RDO 41 (Mandaluyong)",
                "do": "D.O. 059-2022",
                "class": primaryCode,
                "use": "institutional" if is_inst else ("commercial" if is_comm else "residential"),
                "commVal": ccVal if ccVal else crVal,
                "resVal": rcVal if rcVal else rrVal,
                "parkVal": psVal if psVal else 40000,
                "center": [alat, alon],
                "geom": coords,
                "primaryCode": primaryCode,
                "crVal": crVal,
                "ccVal": ccVal,
                "ccStatus": ccStatus,
                "rrVal": rrVal,
                "rcVal": rcVal,
                "rcStatus": rcStatus,
                "psVal": psVal,
                "isInstitutional": is_inst,
                "instType": "Government / Civic" if is_inst else "Commercial / Residential",
                "instClass": "GL" if is_inst else "N/A",
                "instNote": "Barangay / Institutional Facility" if is_inst else "Standard Taxable Real Property",
                "instVal": crVal,
                "exactBirName": exactName,
                "exactBirVicinity": exactVicinity,
                "exactBirSheet": exactSheet,
                "exactBirOrder": exactOrder,
                "exactBirRdo": exactRdo,
                "exactBirRow": exactRow
            }
            hh_properties.append(prop_item)

    print(f"Reconciled {len(hh_properties)} Highway Hills properties.")
    combined = ortigas_properties + hh_properties

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2)

    print(f"[SUCCESS] Saved {len(combined)} properties to {OUTPUT_FILE}")

if __name__ == "__main__":
    run_reconciliation()
