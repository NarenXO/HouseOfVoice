import { RouteObject } from "react-router-dom";
import LearningPathPage from "./LearningPathPage";

// Export a route array. Naren wires this into App.tsx at integration time.
export const learningRoutes: RouteObject[] = [
  { path: "/learning-path", element: <LearningPathPage /> },
];
