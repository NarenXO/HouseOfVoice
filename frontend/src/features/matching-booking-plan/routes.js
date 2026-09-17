import { jsx as _jsx } from "react/jsx-runtime";
import MatchingHome from "./MatchingHome";
// Export a route array. Naren wires this into App.tsx at integration time.
export const matchingRoutes = [
    { path: "/matching-booking-plan", element: _jsx(MatchingHome, {}) },
];
