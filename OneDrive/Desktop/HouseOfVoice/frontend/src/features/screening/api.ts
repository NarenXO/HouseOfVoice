import { ScreeningResult } from '../../shared/types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api/screening';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export interface ClipUploadResponse {
  clip_id: string;
  case_id: string;
  prompt_type: string;
  storage_url: string;
  recorded_at: string;
}

export async function uploadRecording(
  caseId: string,
  promptType: 'sentence' | 'picture' | 'spontaneous',
  audioBlob: Blob
): Promise<ClipUploadResponse> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      clip_id: `mock-clip-${promptType}-${Date.now()}`,
      case_id: caseId,
      prompt_type: promptType,
      storage_url: `mock://storage/${caseId}/${promptType}.wav`,
      recorded_at: new Date().toISOString(),
    };
  }

  const formData = new FormData();
  formData.append('case_id', caseId);
  formData.append('prompt_type', promptType);
  formData.append('audio_file', audioBlob, `${promptType}.wav`);

  const res = await fetch(`${API_BASE}/baseline-recording`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return res.json();
}

export async function runPipeline(
  caseId: string,
  clipIds: Record<string, string>
): Promise<ScreeningResult> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 1800));
    const res = await fetch('/shared/mocks/screening_result.mock.json');
    const data: ScreeningResult = await res.json();
    return { ...data, case_id: caseId, created_at: new Date().toISOString() };
  }

  const res = await fetch(`${API_BASE}/run-pipeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId, clip_ids: clipIds }),
  });
  if (!res.ok) throw new Error(`Pipeline failed: ${res.statusText}`);
  return res.json();
}

export async function getResult(caseId: string): Promise<ScreeningResult> {
  if (USE_MOCKS) {
    const res = await fetch('/shared/mocks/screening_result.mock.json');
    const data: ScreeningResult = await res.json();
    return { ...data, case_id: caseId, created_at: new Date().toISOString() };
  }

  const res = await fetch(`${API_BASE}/result/${caseId}`);
  if (!res.ok) throw new Error(`Fetch result failed: ${res.statusText}`);
  return res.json();
}
