import { RouteObject } from "react-router-dom";
import MatchingHome from "./MatchingHome";

// Export a route array. Naren wires this into App.tsx at integration time.
export const matchingRoutes: RouteObject[] = [
  { path: "/matching-booking-plan", element: <MatchingHome /> },
];
