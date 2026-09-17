import { RouteObject } from "react-router-dom";
import AuthHome from "./AuthHome";

// Export a route array. Naren wires this into App.tsx at integration time.
export const authRoutes: RouteObject[] = [
  { path: "/auth-onboarding", element: <AuthHome /> },
];
