import { jsx as _jsx } from "react/jsx-runtime";
/**
 * OWNERSHIP: Naren only. Nobody else edits this file during the 24h build.
 *
 * Everyone else builds pages + a routes.tsx inside their own
 * src/features/<domain>/ folder. Your feature stays invisible (but
 * harmless) until integration time.
 *
 * INTEGRATION STEP (Naren, after all 6 branches are merged into `main`):
 * uncomment the import + spread lines below for each feature that now
 * exists on disk. That is the ONLY change required to wire the whole
 * team's frontend together.
 */
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { authRoutes } from "./features/auth-onboarding/routes";
// import { screeningRoutes } from "./features/screening/routes";
// import { matchingRoutes } from "./features/matching-booking-plan/routes";
// import { learningRoutes } from "./features/learning-path/routes";
// import { sessionRoutes } from "./features/session-smartboard/routes";
// import { dashboardRoutes } from "./features/dashboard-docs/routes";
// const allRoutes = [
//   ...authRoutes,
//   ...screeningRoutes,
//   ...matchingRoutes,
//   ...learningRoutes,
//   ...sessionRoutes,
//   ...dashboardRoutes,
// ];
function App() {
    return (_jsx(BrowserRouter, { children: _jsx(Routes, { children: _jsx(Route, { path: "/", element: _jsx("div", { className: "p-8 text-lg", children: "HouseOfVoice \u2014 integration pending" }) }) }) }));
}
export default App;
