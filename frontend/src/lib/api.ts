/**
 * Shared axios instance. OWNERSHIP: Naren. Import `api` in your own
 * feature's service file — don't edit this file. Base URL comes from
 * VITE_API_BASE_URL in .env (defaults to local FastAPI on :8000).
 */
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});
