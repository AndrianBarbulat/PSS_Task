"""Read-only check of every imported source cell against the supplied workbook."""
import datetime
import json
from pathlib import Path
import openpyxl

root = Path(__file__).resolve().parents[1]
workbook = openpyxl.load_workbook(root / 'Analyst_PSS_Assessment_Data_v2.xlsx', data_only=True)
snapshot = json.loads((root / 'src/data/assessment.json').read_text(encoding='utf-8'))
def serial(value):
    return value.isoformat() if isinstance(value, (datetime.datetime, datetime.date)) else value
actual = {sheet.title: [[serial(cell) for cell in row] for row in sheet.values] for sheet in workbook}
assert actual == snapshot, 'Imported JSON differs from the supplied workbook'
print('Verified every source cell across all five workbook tabs. No workbook changes made.')
