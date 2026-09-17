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
import MatchingHome from "./features/matching-booking-plan/MatchingHome";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MatchingHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
