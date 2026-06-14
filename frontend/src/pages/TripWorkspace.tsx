import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ImagePlus, MessageCircle, Plus, RefreshCw, Route, Sparkles } from "lucide-react";
import {
  analyzeTrip,
  askTrip,
  createTrip,
  getJob,
  getTrip,
  listTrips,
  uploadPhotos,
  type AnalysisJob,
  type AskResponse,
  type HealthResponse,
  type Photo,
  type Trip,
  type TripDetail
} from "../api/client";
import { UploadPanel } from "../components/upload/UploadPanel";
import { MemoryMap } from "../components/map/MemoryMap";
import { Timeline } from "../components/timeline/Timeline";
import { PhotoDetail } from "../components/photo/PhotoDetail";
import { InsightsPanel } from "../components/insights/InsightsPanel";

type TripWorkspaceProps = {
  health: HealthResponse | null;
  healthError: string | null;
};

export function TripWorkspace({ health, healthError }: TripWorkspaceProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedTripDetail, setSelectedTripDetail] = useState<TripDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
  const [title, setTitle] = useState("First private trip");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [askResponse, setAskResponse] = useState<AskResponse | null>(null);
  const [activeJob, setActiveJob] = useState<AnalysisJob | null>(null);

  const selectedTrip = useMemo(
    () => selectedTripDetail ?? trips.find((trip) => trip.id === selectedTripId) ?? null,
    [selectedTripDetail, selectedTripId, trips]
  );
  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === selectedPhotoId) ?? photos[0] ?? null,
    [photos, selectedPhotoId]
  );

  useEffect(() => {
    void refreshTrips();
  }, []);

  useEffect(() => {
    if (selectedTripId === null) {
      setPhotos([]);
      setSelectedTripDetail(null);
      return;
    }
    void refreshTripDetail(selectedTripId);
  }, [selectedTripId]);

  useEffect(() => {
    if (photos.length > 0 && !photos.some((photo) => photo.id === selectedPhotoId)) {
      setSelectedPhotoId(photos[0].id);
    }
  }, [photos, selectedPhotoId]);

  useEffect(() => {
    if (!activeJob || !isActiveJob(activeJob)) {
      return;
    }

    const timer = window.setInterval(() => {
      void pollJob(activeJob.id);
    }, 1200);

    return () => window.clearInterval(timer);
  }, [activeJob?.id, activeJob?.status]);

  const analysisRunning = activeJob ? isActiveJob(activeJob) : false;
  const hasAnalyzedPhotos = photos.some((photo) => photo.analysis !== null);
  const canAsk = Boolean(selectedTripDetail?.memory && hasAnalyzedPhotos);
  const analyzedCount = photos.filter((photo) => photo.analysis !== null).length;
  const locatedCount = photos.filter(
    (photo) => photo.latitude !== null && photo.longitude !== null
  ).length;
  const journeySteps = [
    {
      label: "Trip",
      detail: selectedTrip ? selectedTrip.title : "Create or select one",
      icon: Route,
      state: selectedTripId === null ? "active" : "complete"
    },
    {
      label: "Photos",
      detail: photos.length > 0 ? `${photos.length} imported` : "Add travel images",
      icon: ImagePlus,
      state:
        photos.length === 0 ? (selectedTripId === null ? "pending" : "active") : "complete"
    },
    {
      label: "Gemma",
      detail: analysisRunning
        ? activeJob?.current_step ?? "Analyzing"
        : analyzedCount > 0
          ? `${analyzedCount} remembered`
          : "Run memory workflow",
      icon: Sparkles,
      state: analysisRunning ? "active" : analyzedCount > 0 ? "complete" : "pending"
    },
    {
      label: "Ask",
      detail: canAsk ? "Grounded Q&A ready" : "Needs trip memory",
      icon: MessageCircle,
      state: canAsk ? "complete" : "pending"
    }
  ];

  async function refreshTrips() {
    try {
      const payload = await listTrips();
      setTrips(payload);
      setSelectedTripId((current) => current ?? payload[0]?.id ?? null);
      setMessage(null);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function refreshTripDetail(tripId: number) {
    try {
      const payload = await getTrip(tripId);
      setSelectedTripDetail(payload);
      setPhotos(payload.photos);
      setTrips((current) =>
        current.map((trip) => (trip.id === payload.id ? {
          id: payload.id,
          title: payload.title,
          description: payload.description,
          created_at: payload.created_at
        } : trip))
      );
      setMessage(null);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleCreateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }
    setBusy(true);
    try {
      const trip = await createTrip({
        title: title.trim(),
        description: description.trim() || null
      });
      setTrips((current) => [trip, ...current]);
      setSelectedTripId(trip.id);
      setSelectedTripDetail(null);
      setPhotos([]);
      setAskResponse(null);
      setActiveJob(null);
      setTitle("");
      setDescription("");
      setMessage(null);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(files: FileList | File[]) {
    if (selectedTripId === null || files.length === 0) {
      return;
    }
    setBusy(true);
    try {
      await uploadPhotos(selectedTripId, files);
      await refreshTripDetail(selectedTripId);
      setAskResponse(null);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAnalyze() {
    if (selectedTripId === null) {
      return;
    }
    setBusy(true);
    try {
      const job = await analyzeTrip(selectedTripId);
      setActiveJob(job);
      setAskResponse(null);
      setMessage(null);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAsk(question: string) {
    if (selectedTripId === null || !canAsk) {
      return;
    }
    setBusy(true);
    try {
      const response = await askTrip(selectedTripId, question);
      setAskResponse(response);
      setMessage(null);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function pollJob(jobId: number) {
    try {
      const job = await getJob(jobId);
      setActiveJob(job);
      if (job.status === "completed") {
        await refreshTripDetail(job.trip_id);
      }
      if (job.status === "failed") {
        setMessage(job.error ?? "Analysis failed");
      }
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <section className="workspace">
      <aside className="trip-rail">
        <div className="rail-intro">
          <span>Local-first workspace</span>
          <h2>Shape a trip into a memory map.</h2>
          <p>Import photos, let Gemma reason over the visual evidence, then ask questions grounded in your own trip.</p>
        </div>

        <form className="trip-form" onSubmit={handleCreateTrip}>
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">Step 1</span>
              <h2>Trips</h2>
            </div>
            <button className="primary-action" type="submit" disabled={busy || !title.trim()} title="Create trip">
              <Plus size={16} aria-hidden="true" />
              <span>Create</span>
            </button>
          </div>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Trip title"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short note"
            rows={3}
          />
        </form>

        <div className="trip-list-section">
          <div className="section-label">Recent trips</div>
          <div className="trip-list">
            {trips.length === 0 ? (
              <p className="empty-copy">Create a trip to begin.</p>
            ) : (
              trips.map((trip) => (
                <button
                  key={trip.id}
                  className={trip.id === selectedTripId ? "selected" : ""}
                  onClick={() => {
                    setSelectedTripId(trip.id);
                    setAskResponse(null);
                    setActiveJob(null);
                  }}
                  type="button"
                >
                  <span className="trip-select-dot" aria-hidden="true" />
                  <span>
                    <strong>{trip.title}</strong>
                    <em>{trip.description || "Local photo memory"}</em>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <UploadPanel
          disabled={selectedTripId === null || busy || analysisRunning}
          onUpload={handleUpload}
        />
      </aside>

      <div className="workspace-main">
        <section className="journey-strip" aria-label="Trip memory workflow progress">
          {journeySteps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className={`journey-step ${step.state}`}>
                <span className="journey-icon">
                  {step.state === "complete" ? (
                    <CheckCircle2 size={18} aria-hidden="true" />
                  ) : (
                    <Icon size={18} aria-hidden="true" />
                  )}
                </span>
                <span>
                  <strong>{step.label}</strong>
                  <em>{step.detail}</em>
                </span>
              </div>
            );
          })}
        </section>

        <div className="main-grid">
        <section className="map-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Memory atlas</span>
              <h2>{selectedTrip?.title ?? "Memory Map"}</h2>
              <p>{selectedTrip?.description || "Map EXIF locations without inventing coordinates."}</p>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={() => selectedTripId && refreshTripDetail(selectedTripId)}
              disabled={selectedTripId === null || busy}
              title="Refresh photos"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="map-stats">
            <span>
              <strong>{photos.length}</strong>
              Photos
            </span>
            <span>
              <strong>{locatedCount}</strong>
              On map
            </span>
            <span>
              <strong>{analyzedCount}</strong>
              Remembered
            </span>
          </div>
          <MemoryMap
            photos={photos}
            selectedPhotoId={selectedPhoto?.id ?? null}
            onSelectPhoto={setSelectedPhotoId}
          />
        </section>

        <Timeline
          photos={photos}
          selectedPhotoId={selectedPhoto?.id ?? null}
          onSelectPhoto={setSelectedPhotoId}
        />

        <PhotoDetail photo={selectedPhoto} />

        <InsightsPanel
          health={health}
          healthError={healthError}
          askDisabled={!canAsk || busy || analysisRunning}
          analyzeDisabled={
            selectedTripId === null || busy || analysisRunning || photos.length === 0
          }
          job={activeJob}
          tripMemory={selectedTripDetail?.memory ?? null}
          askResponse={askResponse}
          onAnalyze={handleAnalyze}
          onAsk={handleAsk}
          onSelectEvidence={setSelectedPhotoId}
        />
        </div>
      </div>

      {message ? <div className="toast">{message}</div> : null}
    </section>
  );
}

function isActiveJob(job: AnalysisJob): boolean {
  return job.status === "queued" || job.status === "running";
}
