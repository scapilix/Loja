# Directive: Deep Excel Analysis (Formatted Grouping)

## Goal
Identify "total" rows (blue lines) and "item" rows in the "Encomendas" sheet of `Excel Loja.xlsm` to correctly group sales data.

## Inputs
- `Excel Loja.xlsm`
- Sheet: `Encomendas`

## Tools/Scripts
- `execution/analyze_encomendas_v2.py`

## Steps
1. Use `openpyxl` to read the Excel file with formatting.
2. Iterate through rows in the "Encomendas" sheet.
3. Check the background color of cells (specifically looking for the blue color mentioned by the user).
4. Identify which column stores the "Total" (user mentioned `REF`).
5. Map the relationship between "Item" rows (above blue line) and "Total" rows (blue line).
6. Export the logic/pattern to a JSON structure that the transformation script can use.

## Outputs
- `.tmp/encomendas_grouping_logic.json`

## Edge Cases
- Rows with different shades of blue.
- Rows where the color is missing but the pattern (metadata filled) is present.
- Very long lists of items.
