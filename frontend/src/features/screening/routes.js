import { jsx as _jsx } from "react/jsx-runtime";
import ScreeningHome from "./ScreeningHome";
// Export a route array. Naren wires this into App.tsx at integration time.
export const screeningRoutes = [
    { path: "/screening", element: _jsx(ScreeningHome, {}) },
];
