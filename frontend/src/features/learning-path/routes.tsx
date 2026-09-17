import { RouteObject } from "react-router-dom";
import LearningHome from "./LearningHome";

// Export a route array. Naren wires this into App.tsx at integration time.
export const learningRoutes: RouteObject[] = [
  { path: "/learning-path", element: <LearningHome /> },
];
