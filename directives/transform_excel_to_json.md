# Directive: Transform Excel to JSON

## Goal
Convert the retail data from `Excel Loja.xlsm` into optimized JSON files for the analysis application.

## Inputs
- `Excel Loja.xlsm`
- Sheet names: `BD Clientes`, `Encomendas`, `STOCK MASTER` (and others as identified in analysis)

## Tools/Scripts
- `execution/transform_excel.js`

## Steps
1. Read the Excel file using the `xlsx` library.
2. Select target sheets for analysis.
3. Clean and normalize headers (remove spaces, special characters).
4. Export data to `.tmp/data_transformed.json`.

## Outputs
- `.tmp/data_transformed.json`

## Edge Cases
- Missing columns or empty rows.
- Incorrect data types (e.g., dates as numbers).
