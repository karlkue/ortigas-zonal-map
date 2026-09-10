"""
Script: 03_parse_bir_schedules.py
Purpose: Parse the official BIR Excel spreadsheets for the governing barangays:
         1. Mandaluyong: Wack-Wack - Greenhills East (Sheet 9, DO 059-2022)
         2. Mandaluyong: Highway Hills (Sheet 9, DO 059-2022)
         3. Pasig: San Antonio (Sheet 9, DO 024-2023)
         4. Quezon City: Ugong Norte (Sheet 7, DO 021-2020)
Output: data/ortigas/official_bir_parsed_all.json
"""

import json
import os
import sys

try:
    import xlrd
except ImportError:
    print("Please install xlrd: pip install xlrd==2.0.1")
    sys.exit(1)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw", "bir_excels")
OUTPUT_FILE = os.path.join(BASE_DIR, "data", "ortigas", "official_bir_parsed_all.json")
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

def parse_sheet_section(sheet, start_row, end_row, brgy_name, rdo_name, do_name):
    records = []
    current_name = ""
    current_vicinity = ""

    for r in range(start_row, end_row):
        vals = [str(sheet.cell_value(r, c)).strip() for c in range(sheet.ncols)]
        if not any(vals):
            continue

        line = " ".join(vals).upper()
        if any(h in line for h in ["ZONE/BARANGAY", "BARANGAY", "D.O. NO.", "CITY/MUNICIPALITY", "PROVINCE", "EFFECTIVITY DATE", "STREET NAME/", "STREETS/SUBDIVISIONS"]):
            continue

        col0 = vals[0] if len(vals) > 0 else ""
        col1 = vals[1] if len(vals) > 1 else ""

        if col0 and not col0.startswith("*") and col0 not in ['RC', 'CC', 'CR', 'RR', 'PS', 'X', 'GL', 'I']:
            current_name = col0
            if col1 and col1 not in ['RC', 'CC', 'CR', 'RR', 'PS', 'X', 'GL', 'I']:
                current_vicinity = col1
        elif col1 and col1 not in ['RC', 'CC', 'CR', 'RR', 'PS', 'X', 'GL', 'I']:
            current_vicinity = col1

        row_class = None
        row_val = None
        for c in range(len(vals)):
            token = vals[c].replace('*', '')
            if token in ['CR', 'CC', 'RR', 'RC', 'PS', 'X', 'GL', 'I', 'GP']:
                row_class = token
                for next_c in range(c + 1, len(vals)):
                    try:
                        row_val = float(vals[next_c].replace(',', ''))
                        break
                    except ValueError:
                        pass
                break

        if row_class and row_val:
            records.append({
                'name': current_name,
                'vicinity': current_vicinity,
                'class': row_class,
                'value': row_val,
                'brgy': brgy_name,
                'rdo': rdo_name,
                'do': do_name,
                'row': r + 1 # 1-indexed for Excel comparison
            })

    return records

def parse_all():
    # 1. Pasig City (San Antonio ONLY: Rows 2642 to 3056)
    pasig_path = os.path.join(RAW_DIR, "RDO No. 43 - Pasig City.xls")
    print(f"Parsing Pasig City (San Antonio) from {pasig_path}...")
    wb_pasig = xlrd.open_workbook(pasig_path)
    sheet_pasig = wb_pasig.sheet_by_name("Sheet 9 (DO 24-2023)")
    sa_records = parse_sheet_section(sheet_pasig, 2641, 3056, "San Antonio", "RDO 43 (Pasig)", "D.O. 024-2023")
    print(f"  -> Found {len(sa_records)} rows for Brgy. San Antonio.")

    # 2. Mandaluyong City (Wack-Wack - Greenhills East ONLY: Rows 1483 to 1604)
    manda_path = os.path.join(RAW_DIR, "RDO No. 41 - Mandaluyong City.xls")
    print(f"Parsing Mandaluyong City (Wack-Wack & Highway Hills) from {manda_path}...")
    wb_manda = xlrd.open_workbook(manda_path)
    sheet_manda = wb_manda.sheet_by_name("Sheet 9 (DO 059-2022")
    ww_records = parse_sheet_section(sheet_manda, 1482, 1604, "Wack-Wack Greenhills", "RDO 41 (Mandaluyong)", "D.O. 059-2022")
    print(f"  -> Found {len(ww_records)} rows for Brgy. Wack-Wack - Greenhills East.")

    # 2b. Mandaluyong City (Highway Hills: Rows 680 to 841)
    hh_records = parse_sheet_section(sheet_manda, 679, 841, "Highway Hills", "RDO 41 (Mandaluyong)", "D.O. 059-2022")
    print(f"  -> Found {len(hh_records)} rows for Brgy. Highway Hills.")

    # 3. Quezon City (Ugong Norte ONLY: Rows 2312 to 2358)
    qc_path = os.path.join(RAW_DIR, "RDO No. 40 - Cubao.xls")
    print(f"Parsing Quezon City (Ugong Norte) from {qc_path}...")
    wb_qc = xlrd.open_workbook(qc_path)
    sheet_qc = wb_qc.sheet_by_name("Sheet 7 (DO 21-2020)")
    un_records = parse_sheet_section(sheet_qc, 2311, 2358, "Ugong Norte", "RDO 40 (Cubao)", "D.O. 021-2020")
    print(f"  -> Found {len(un_records)} rows for Brgy. Ugong Norte.")

    result = {
        'san_antonio': sa_records,
        'wack_wack': ww_records,
        'highway_hills': hh_records,
        'ugong_norte': un_records
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)

    total_count = len(sa_records) + len(ww_records) + len(hh_records) + len(un_records)
    print(f"[SUCCESS] Saved {OUTPUT_FILE} (Total {total_count} official BIR rows)")

if __name__ == "__main__":
    parse_all()
