import { jsx as _jsx } from "react/jsx-runtime";
import SessionHome from "./SessionHome";
// Export a route array. Naren wires this into App.tsx at integration time.
export const sessionRoutes = [
    { path: "/session-smartboard", element: _jsx(SessionHome, {}) },
];
