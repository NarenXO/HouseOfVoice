import { RouteObject } from "react-router-dom";
import DashboardHome from "./DashboardHome";

// Export a route array. Naren wires this into App.tsx at integration time.
export const dashboardRoutes: RouteObject[] = [
  { path: "/dashboard-docs", element: <DashboardHome /> },
];
