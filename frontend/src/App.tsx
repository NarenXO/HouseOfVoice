import { BrowserRouter, Routes, Route } from "react-router-dom";
import MatchingHome from "./features/matching-booking-plan/MatchingHome";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MatchingHome />} />
      </Routes>
    </BrowserRouter>
  );
}
