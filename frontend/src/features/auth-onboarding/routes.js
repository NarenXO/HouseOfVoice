import { jsx as _jsx } from "react/jsx-runtime";
import AuthHome from "./AuthHome";
// Export a route array. Naren wires this into App.tsx at integration time.
export const authRoutes = [
    { path: "/auth-onboarding", element: _jsx(AuthHome, {}) },
];
