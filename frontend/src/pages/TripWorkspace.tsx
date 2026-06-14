import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import { MemoryCompanion } from "../components/companion/MemoryCompanion";
import { MemoryMap } from "../components/map/MemoryMap";
import { PhotoMosaic } from "../components/photo/PhotoMosaic";
import { MemoryStory } from "../components/story/MemoryStory";
import { TripCover } from "../components/story/TripCover";
import { type MemoryView, ViewSwitcher } from "../components/story/ViewSwitcher";
import { UploadPanel } from "../components/upload/UploadPanel";

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
  const [spotlightPhotoId, setSpotlightPhotoId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<MemoryView>("story");
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
  const coverPhoto = selectedPhoto ?? photos.find((photo) => photo.analysis) ?? photos[0] ?? null;

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
        current.map((trip) =>
          trip.id === payload.id
            ? {
                id: payload.id,
                title: payload.title,
                description: payload.description,
                created_at: payload.created_at
              }
            : trip
        )
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
      setSelectedPhotoId(null);
      setSpotlightPhotoId(null);
      setAskResponse(null);
      setActiveJob(null);
      setActiveView("story");
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
      setMessage(null);
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
      setActiveView("story");
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
        setActiveView("story");
      }
      if (job.status === "failed") {
        setMessage(job.error ?? "Analysis failed");
      }
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  function handleSelectPhoto(photoId: number) {
    if (!photos.some((photo) => photo.id === photoId)) {
      return;
    }
    setSelectedPhotoId(photoId);
    setSpotlightPhotoId(photoId);
    window.setTimeout(() => {
      setSpotlightPhotoId((current) => (current === photoId ? null : current));
    }, 1400);
  }

  function handleSelectEvidence(photoId: number) {
    handleSelectPhoto(photoId);
    setActiveView("story");
  }

  return (
    <section className="workspace story-workspace">
      <aside className="trip-rail story-rail">
        <div className="rail-intro">
          <span>Private library</span>
          <h2>Keep the trip close.</h2>
          <p>Choose a trip, import photos, and let the memory unfold locally.</p>
        </div>

        <form className="trip-form" onSubmit={handleCreateTrip}>
          <div className="panel-heading compact">
            <div>
              <span className="soft-kicker">New trip</span>
              <h2>Start a memory</h2>
            </div>
            <button
              className="primary-action"
              type="submit"
              disabled={busy || !title.trim()}
              title="Create trip"
            >
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
            placeholder="A short note about this trip"
            rows={3}
          />
        </form>

        <div className="trip-list-section">
          <div className="section-label">Trip library</div>
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
                    setActiveView("story");
                  }}
                  type="button"
                >
                  <span className="trip-select-dot" aria-hidden="true" />
                  <span>
                    <strong>{trip.title}</strong>
                    <em>{trip.description || "Private photo memory"}</em>
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

      <main className="memory-reader">
        <TripCover
          trip={selectedTrip}
          coverPhoto={coverPhoto}
          photoCount={photos.length}
          locatedCount={locatedCount}
          analyzedCount={analyzedCount}
          analyzeDisabled={
            selectedTripId === null || busy || analysisRunning || photos.length === 0
          }
          job={activeJob}
          onAnalyze={handleAnalyze}
        />

        <ViewSwitcher
          activeView={activeView}
          photoCount={photos.length}
          onChange={setActiveView}
        />

        <div className="memory-surface">
          {activeView === "story" ? (
            <MemoryStory
              memory={selectedTripDetail?.memory ?? null}
              photos={photos}
              selectedPhoto={selectedPhoto}
              selectedPhotoId={selectedPhoto?.id ?? null}
              spotlightPhotoId={spotlightPhotoId}
              onSelectPhoto={handleSelectPhoto}
              onSelectEvidence={handleSelectEvidence}
            />
          ) : null}

          {activeView === "map" ? (
            <section className="map-view">
              <div className="section-heading">
                <div>
                  <span className="soft-kicker">Map context</span>
                  <h2>Places from EXIF metadata</h2>
                </div>
              </div>
              <div className="map-stat-row">
                <span>
                  <strong>{photos.length}</strong>
                  Photos
                </span>
                <span>
                  <strong>{locatedCount}</strong>
                  Mapped
                </span>
                <span>
                  <strong>{photos.length - locatedCount}</strong>
                  Without GPS
                </span>
              </div>
              <MemoryMap
                photos={photos}
                selectedPhotoId={selectedPhoto?.id ?? null}
                onSelectPhoto={handleSelectPhoto}
              />
            </section>
          ) : null}

          {activeView === "photos" ? (
            <PhotoMosaic
              photos={photos}
              selectedPhotoId={selectedPhoto?.id ?? null}
              spotlightPhotoId={spotlightPhotoId}
              onSelectPhoto={handleSelectPhoto}
            />
          ) : null}
        </div>
      </main>

      <MemoryCompanion
        health={health}
        healthError={healthError}
        askDisabled={!canAsk || busy || analysisRunning}
        job={activeJob}
        tripMemory={selectedTripDetail?.memory ?? null}
        askResponse={askResponse}
        onAsk={handleAsk}
        onSelectEvidence={handleSelectEvidence}
      />

      {message ? <div className="toast">{message}</div> : null}
    </section>
  );
}

function isActiveJob(job: AnalysisJob): boolean {
  return job.status === "queued" || job.status === "running";
}
