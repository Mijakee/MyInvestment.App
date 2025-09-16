#!/usr/bin/env python3
"""
Fix JSON file by replacing NaN values with null
"""
import json
import re

# Read the file
with open('../src/data/wa_suburbs_final.json', 'r') as f:
    content = f.read()

# Replace NaN with null for valid JSON
fixed_content = re.sub(r'\bNaN\b', 'null', content)

# Parse to verify valid JSON
try:
    data = json.loads(fixed_content)
    print(f"JSON is now valid with {len(data['suburbs'])} suburbs")
except json.JSONDecodeError as e:
    print(f"Still invalid JSON: {e}")
    exit(1)

# Write back
with open('../src/data/wa_suburbs_final.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Fixed JSON file successfully")