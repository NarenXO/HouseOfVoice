import { jsx as _jsx } from "react/jsx-runtime";
import DashboardHome from "./DashboardHome";
// Export a route array. Naren wires this into App.tsx at integration time.
export const dashboardRoutes = [
    { path: "/dashboard-docs", element: _jsx(DashboardHome, {}) },
];
