"""
Script: 01_download_bir_excels.py
Purpose: Download official BIR Zonal Values Excel workbooks from the BIR portal.

The Bureau of Internal Revenue (BIR) publishes official zonal values at:
https://www.bir.gov.ph/zonal-values?hl=en-US

For Ortigas Center, three Regional District Offices (RDOs) govern the area:
1. RDO No. 41 - Mandaluyong City (D.O. 059-2022)
2. RDO No. 43 - Pasig City (D.O. 024-2023)
3. RDO No. 40 - Cubao, Quezon City (D.O. 021-2020)
"""

import os
import sys
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "data", "raw", "bir_excels")
os.makedirs(OUTPUT_DIR, exist_ok=True)

BIR_FILES = [
    {
        "name": "RDO No. 41 - Mandaluyong City.xls",
        "rdo": "41",
        "city": "Mandaluyong",
        "do": "059-2022",
        "url": "https://www.bir.gov.ph/images/bir_files/zonal_values/RDO%20No.%2041%20-%20Mandaluyong%20City.xls"
    },
    {
        "name": "RDO No. 43 - Pasig City.xls",
        "rdo": "43",
        "city": "Pasig",
        "do": "024-2023",
        "url": "https://www.bir.gov.ph/images/bir_files/zonal_values/RDO%20No.%2043%20-%20Pasig%20City.xls"
    },
    {
        "name": "RDO No. 40 - Cubao.xls",
        "rdo": "40",
        "city": "Quezon City",
        "do": "021-2020",
        "url": "https://www.bir.gov.ph/images/bir_files/zonal_values/RDO%20No.%2040%20-%20Cubao.xls"
    }
]

def download_files():
    print(f"Target directory: {OUTPUT_DIR}")
    for item in BIR_FILES:
        target_path = os.path.join(OUTPUT_DIR, item["name"])
        if os.path.exists(target_path):
            size_mb = os.path.getsize(target_path) / (1024 * 1024)
            print(f"[OK] {item['name']} already exists ({size_mb:.2f} MB). Skipping download.")
            continue

        print(f"Downloading {item['name']} from {item['url']}...")
        try:
            req = urllib.request.Request(item["url"], headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req) as resp, open(target_path, "wb") as out:
                out.write(resp.read())
            size_mb = os.path.getsize(target_path) / (1024 * 1024)
            print(f"[SUCCESS] Downloaded {item['name']} ({size_mb:.2f} MB)")
        except Exception as e:
            print(f"[WARNING] Could not direct-download {item['name']}: {e}")
            print(f"Please manually place {item['name']} into {OUTPUT_DIR}")

if __name__ == "__main__":
    download_files()
