import { RouteObject } from "react-router-dom";
import SessionHome from "./SessionHome";
import SessionRoom from "./SessionRoom";
import ModuleLibrary from "./ModuleLibrary";

// Export a route array. Naren wires this into App.tsx at integration time.
export const sessionRoutes: RouteObject[] = [
  { path: "/session-smartboard", element: <SessionHome /> },
  { path: "/session", element: <SessionRoom /> },
  { path: "/module-library", element: <ModuleLibrary /> },
];
