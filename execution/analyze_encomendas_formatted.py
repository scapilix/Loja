
import openpyxl
import json
import os

excel_file = 'Excel Loja.xlsm'
sheet_name = 'Encomendas'

def analyze_encomendas():
    if not os.path.exists(excel_file):
        print(f"Error: {excel_file} not found")
        return

    print(f"Loading {excel_file} with formatting...")
    wb = openpyxl.load_workbook(excel_file, data_only=True)
    if sheet_name not in wb.sheetnames:
        print(f"Error: Sheet {sheet_name} not found")
        return

    sheet = wb[sheet_name]
    rows = list(sheet.rows)
    
    # Header is likely the first row with data
    header_row = None
    for i, row in enumerate(rows):
        if row[1].value == "#ID Venda" or row[4].value == "REF":
            header_row = i
            break
    
    if header_row is None:
        header_row = 0

    analysis = []
    current_items = []
    
    print(f"Scanning rows starting from {header_row + 2}...")
    
    # Iterate from after header
    for i in range(header_row + 1, len(rows)):
        row = rows[i]
        
        # Check background color of the first few cells
        # excel colors are ARGB hex strings
        fill_color = row[4].fill.start_color.index # Check REF column fill or ID column
        # Also check column 1 (#ID Venda)
        id_fill = row[1].fill.start_color.index
        
        # User says "linha azul"
        # Common blue hex codes in Excel: 0000CCFF (Light Blue), 003366FF (Blue), etc.
        # We also check if #ID Venda is filled, as items usually have it null while total has it
        
        row_data = {
            "row_index": i + 1,
            "ref": row[4].value,
            "pvp": row[5].value,
            "id_venda": row[1].value,
            "color_ref": str(fill_color),
            "color_id": str(id_fill),
            "is_blue": False
        }

        # Look for blue shades
        # openpyxl returns '00000000' for no fill or theme indices
        # Let's check for any non-white/non-null color as a proxy if we don't know the exact index
        if str(id_fill) != '00000000' and str(id_fill) != 'FFFFFFFF' and id_fill != 0:
            row_data["is_blue"] = True

        if row_data["is_blue"]:
            # This is a "Total" row according to user pattern
            sale = {
                "total_row": row_data,
                "items": current_items
            }
            analysis.append(sale)
            current_items = []
        else:
            # This is an "Item" row
            if row_data["ref"] is not None:
                current_items.append(row_data)

    output_path = os.path.join('.tmp', 'encomendas_grouping_logic.json')
    os.makedirs('.tmp', exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(analysis[:50], f, indent=2, ensure_ascii=False) # Limit to first 50 for inspection
    
    print(f"Analysis saved to {output_path}")

if __name__ == "__main__":
    analyze_encomendas()
