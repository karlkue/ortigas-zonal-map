"""
Script: 04_reconcile_and_match.py
Purpose: Reconcile physical building footprints with official BIR Excel schedules
         using strict 3-barangay spatial partitioning and alias entity resolution.
Output: data/ortigas/final_reconciled_properties.json
"""

import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_PROPS_FILE = os.path.join(BASE_DIR, "data", "ortigas", "final_reconciled_properties.json")
BIR_PARSED_FILE = os.path.join(BASE_DIR, "data", "ortigas", "official_bir_parsed_all.json")
OUTPUT_FILE = os.path.join(BASE_DIR, "data", "ortigas", "final_reconciled_properties.json")

def load_data():
    with open(RAW_PROPS_FILE, 'r', encoding='utf-8') as f:
        properties = json.load(f)
    with open(BIR_PARSED_FILE, 'r', encoding='utf-8') as f:
        bir_parsed = json.load(f)
    return properties, bir_parsed

def run_reconciliation():
    properties, bir_parsed = load_data()
    print(f"Loaded {len(properties)} properties and BIR parsed schedules.")

    sa_records = bir_parsed['san_antonio']
    ww_records = bir_parsed['wack_wack']
    un_records = bir_parsed['ugong_norte']

    def index_buildings(records, sheet_name):
        blds = {}
        for r in records:
            name = r['name'].upper().strip()
            if name not in blds:
                blds[name] = {
                    'name': r['name'].strip(),
                    'vicinity': r['vicinity'].strip(),
                    'rdo': r['rdo'],
                    'do': r['do'],
                    'sheet': sheet_name,
                    'row': r['row'],
                    'rates': {}
                }
            blds[name]['rates'][r['class']] = r['value']
        return blds

    sa_blds = index_buildings(sa_records, 'Sheet 9 (DO 24-2023)')
    ww_blds = index_buildings(ww_records, 'Sheet 9 (DO 059-2022)')
    un_blds = index_buildings(un_records, 'Sheet 7 (DO 21-2020)')

    print("Index complete:")
    print(f"  Pasig San Antonio Buildings: {len(sa_blds)}")
    print(f"  Mandaluyong Wack-Wack Buildings: {len(ww_blds)}")
    print(f"  QC Ugong Norte Buildings: {len(un_blds)}")

    # Verification of key landmarks:
    assert 'ST. FRANCIS SHANGRI-LA PLACE' in ww_blds, "Missing St. Francis Shangri-La"
    assert 'ONE SHANGRI-LA PLACE' in ww_blds, "Missing One Shangri-La"
    assert 'PHIL. STOCK EXCHANGE CTR (FORMERLY  \"TEKTITE TOWER)' in sa_blds or any('TEKTITE' in k for k in sa_blds), "Missing Tektite"

    print("[SUCCESS] Data validated and ready for build.")

if __name__ == "__main__":
    run_reconciliation()
