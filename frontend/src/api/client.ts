export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type HealthResponse = {
  status: string;
  app: string;
  gemma_model: string;
  database: string;
  storage: string;
};

export type Trip = {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
};

export type MemorableMoment = {
  title: string;
  description: string;
  evidence_photo_ids: number[];
};

export type TripMemory = {
  trip_id: number;
  narrative_summary: string;
  inferred_interests: string[];
  recurring_themes: string[];
  memorable_moments: MemorableMoment[];
  evidence_photo_ids: number[];
  uncertainty_notes: string[];
  raw_model_json: Record<string, unknown>;
  prompt_version: string;
  created_at: string;
  updated_at: string;
};

export type PhotoAnalysis = {
  photo_id: number;
  scene: string;
  activities: string[];
  objects: string[];
  mood: string;
  memory_prompt: string;
  confidence: number;
  raw_model_json: Record<string, unknown>;
  scene_summary: string;
  memory_caption: string;
  place_type: string;
  visible_activities: string[];
  visible_objects: string[];
  sensory_details: string[];
  inferred_interest_signals: string[];
  uncertainty_notes: string[];
};

export type Photo = {
  id: number;
  trip_id: number;
  filename: string;
  stored_path: string;
  image_url: string;
  captured_at: string | null;
  latitude: number | null;
  longitude: number | null;
  exif_json: Record<string, unknown>;
  created_at: string;
  analysis: PhotoAnalysis | null;
};

export type TripDetail = Trip & {
  photos: Photo[];
  memory: TripMemory | null;
};

export type AskResponse = {
  answer: string;
  evidence_photo_ids: number[];
};

export type AnalysisJob = {
  id: number;
  trip_id: number;
  status: "queued" | "running" | "completed" | "failed" | string;
  current_step: string;
  completed_steps: number;
  total_steps: number;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health");
}

export async function listTrips(): Promise<Trip[]> {
  return request<Trip[]>("/api/trips");
}

export async function getTrip(tripId: number): Promise<TripDetail> {
  return request<TripDetail>(`/api/trips/${tripId}`);
}

export async function createTrip(payload: {
  title: string;
  description?: string | null;
}): Promise<Trip> {
  return request<Trip>("/api/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function listPhotos(tripId: number): Promise<Photo[]> {
  return request<Photo[]>(`/api/trips/${tripId}/photos`);
}

export async function uploadPhotos(
  tripId: number,
  files: FileList | File[]
): Promise<Photo[]> {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));
  return request<Photo[]>(`/api/trips/${tripId}/photos`, {
    method: "POST",
    body: formData
  });
}

export async function analyzeTrip(tripId: number): Promise<AnalysisJob> {
  return request<AnalysisJob>(`/api/trips/${tripId}/analyze`, { method: "POST" });
}

export async function getJob(jobId: number): Promise<AnalysisJob> {
  return request<AnalysisJob>(`/api/jobs/${jobId}`);
}

export async function askTrip(
  tripId: number,
  question: string
): Promise<AskResponse> {
  return request<AskResponse>(`/api/trips/${tripId}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });
}

export function assetUrl(path: string): string {
  if (path.startsWith("http")) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || response.statusText);
  }
  return response.json() as Promise<T>;
}
