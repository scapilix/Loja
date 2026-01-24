# Directive: Implement Data Explorer (Tables & Filters)

## Goal

Create advanced, interactive tables for exploring Orders and Customers data.

## Inputs

- `src/data/data.json`
- `implementation_plan.md`

## Components to Build

1. **DataTable**: A reusable, glass-morphic table component with search and pagination.
2. **OrderTable**: Specific implementation for the "Encomendas" sheet.
3. **CustomerTable**: Specific implementation for the "BD Clientes" sheet.

## Steps

1. Create a generic `Table.tsx` component with Tailwind styling.
2. Implement search logic in `App.tsx` or a custom hook.
3. Map JSON data fields to table columns with proper formatting (currency, dates).
4. Add status badges (e.g., payment type, delivery method).

## Outputs

- `src/components/DataTable.tsx`
- Refined `src/App.tsx` with tab logic for tables.

## Edge Cases

- Long text truncation.
- Empty search results.
- Performance with large datasets (virtualization if needed).
