import { RouteObject } from "react-router-dom";
import ScreeningHome from "./ScreeningHome";

// Export a route array. Naren wires this into App.tsx at integration time.
export const screeningRoutes: RouteObject[] = [
  { path: "/screening", element: <ScreeningHome /> },
];
