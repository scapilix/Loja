
import pandas as pd
import json

excel_file = 'Excel Loja.xlsm'

try:
    xl = pd.ExcelFile(excel_file)
    sheets = xl.sheet_names
    print(f"Sheet names: {sheets}")
    
    summary = {}
    for sheet in sheets[:5]: # Analyze first 5 sheets
        df = pd.read_excel(excel_file, sheet_name=sheet, nrows=5)
        summary[sheet] = {
            "columns": df.columns.tolist(),
            "preview": df.to_dict(orient='records')
        }
    
    with open('excel_analysis.json', 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print("Analysis saved to excel_analysis.json")

except Exception as e:
    print(f"Error: {e}")
