"""
Script: 02_fetch_osm_buildings.py
Purpose: Query OpenStreetMap (Overpass API) to fetch all physical building footprints
         and metadata within the Ortigas Center perimeter.
"""

import json
import os
import sys
import urllib.request
import urllib.parse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE = os.path.join(BASE_DIR, "data", "raw", "osm", "ortigas_osm_buildings_raw.json")
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

# Bounding box for Ortigas Center (South, West, North, East)
# [14.57498, 121.0538, 14.59304, 121.06385]
BBOX = "14.57498,121.0538,14.59304,121.06385"

# Overpass QL Query: retrieve all building ways and relations with geometric coordinates
OVERPASS_QUERY = f"""
[out:json][timeout:60];
(
  way["building"]({BBOX});
  relation["building"]({BBOX});
);
out body;
>;
out skel qt;
"""

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def fetch_osm():
    if os.path.exists(OUTPUT_FILE) and os.path.getsize(OUTPUT_FILE) > 10000:
        size_kb = os.path.getsize(OUTPUT_FILE) / 1024
        print(f"[OK] {OUTPUT_FILE} already exists ({size_kb:.1f} KB). Skipping query.")
        return

    print(f"Querying Overpass API for Ortigas Center footprints ({BBOX})...")
    data = urllib.parse.urlencode({'data': OVERPASS_QUERY}).encode('utf-8')
    req = urllib.request.Request(OVERPASS_URL, data=data, headers={'User-Agent': 'OrtigasZonalMap/1.0'})
    
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            content = resp.read()
            with open(OUTPUT_FILE, 'wb') as f:
                f.write(content)
        size_kb = os.path.getsize(OUTPUT_FILE) / 1024
        print(f"[SUCCESS] Saved {OUTPUT_FILE} ({size_kb:.1f} KB)")
    except Exception as e:
        print(f"[ERROR] Overpass API query failed: {e}")

if __name__ == "__main__":
    fetch_osm()
