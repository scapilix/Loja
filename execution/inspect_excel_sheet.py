import pandas as pd

try:
    df = pd.read_excel('Excel Loja.xlsm', sheet_name='VALORES ORIGINAL', engine='openpyxl')
    print("Columns:", df.columns.tolist())
    print("\nFirst 5 rows:")
    print(df.head(5).to_string())
except Exception as e:
    print(f"Error: {e}")
