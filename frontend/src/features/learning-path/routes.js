import { jsx as _jsx } from "react/jsx-runtime";
import LearningPathPage from "./LearningPathPage";
// Export a route array. Naren wires this into App.tsx at integration time.
export const learningRoutes = [
    { path: "/learning-path", element: _jsx(LearningPathPage, {}) },
];
