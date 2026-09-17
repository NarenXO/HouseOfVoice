import { ScreeningResult } from '../../shared/types';

const API_BASE = '/api/screening';

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

  const res = await fetch(`${API_BASE}/run-pipeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId, clip_ids: clipIds }),
  });
  if (!res.ok) {
    let errorDetail = `Pipeline failed: ${res.statusText}`;
    try {
      const errorData = await res.json();
      if (errorData.detail) errorDetail = errorData.detail;
    } catch (e) {
      // Ignore JSON parse error if body is empty
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export async function getResult(caseId: string): Promise<ScreeningResult> {

  const res = await fetch(`${API_BASE}/result/${caseId}`);
  if (!res.ok) throw new Error(`Fetch result failed: ${res.statusText}`);
  return res.json();
}
