import { RouteObject } from "react-router-dom";
import SessionHome from "./SessionHome";

// Export a route array. Naren wires this into App.tsx at integration time.
export const sessionRoutes: RouteObject[] = [
  { path: "/session-smartboard", element: <SessionHome /> },
];
