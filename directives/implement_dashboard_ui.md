# Directive: Implement Dashboard UI

## Goal

Build a high-performance, aesthetically superior Dashboard for the retail analysis application.

## Inputs

- `src/data/data.json` (Transformed retail data)
- `Diretrizes.md` (3-Layer Architecture & Operating Principles)
- `implementation_plan.md` (Design & Feature specifications)

## Components to Build

1. **KpiGrid**: Display Revenue, Profit, Order Count, and Avg Ticket.
2. **RevenueChart**: Area chart using Recharts for sales trends.
3. **RegionalAnalysis**: Bar chart for distribution by locality.
4. **Sidebar/Search**: Navigation and filtering logic.

## Steps

1. Create a custom hook `useDashboardData.ts` to process raw JSON into chart-ready formats (Execution Layer of the app).
2. Implement functional React components using Tailwind CSS and Framer Motion.
3. Ensure Glassmorphism and Dark Mode consistency.
4. Add micro-animations for interactions.

## Outputs

- `src/hooks/useDashboardData.ts`
- `src/components/KpiCard.tsx`
- `src/components/DashboardCharts.tsx`
- Refined `src/App.tsx`

## Edge Cases

- No data available (empty state).
- Extremely large numbers (proper formatting).
- Mobile responsiveness for charts.
