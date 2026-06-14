import { ImagePlus, MapPin, Sparkles } from "lucide-react";
import {
  assetUrl,
  type AnalysisJob,
  type Photo,
  type Trip
} from "../../api/client";
import { jobPercent, jobStage } from "./jobStatus";

type TripCoverProps = {
  trip: Trip | null;
  coverPhoto: Photo | null;
  photoCount: number;
  locatedCount: number;
  analyzedCount: number;
  analyzeDisabled: boolean;
  job: AnalysisJob | null;
  onAnalyze: () => void;
};

export function TripCover({
  trip,
  coverPhoto,
  photoCount,
  locatedCount,
  analyzedCount,
  analyzeDisabled,
  job,
  onAnalyze
}: TripCoverProps) {
  const title = trip?.title ?? "Start a private trip";
  const description =
    trip?.description ||
    (photoCount > 0
      ? "Your photos are ready. Develop them into a private trip memory."
      : "Import travel photos to begin building a local memory map.");
  const buttonLabel =
    photoCount === 0
      ? "Add photos first"
      : job && (job.status === "queued" || job.status === "running")
        ? "Developing..."
        : analyzedCount > 0
          ? "Develop again"
          : "Develop memories";

  return (
    <section className={`trip-cover ${coverPhoto ? "has-photo" : "empty"}`}>
      {coverPhoto ? (
        <img
          key={coverPhoto.id}
          className="trip-cover-image"
          src={assetUrl(coverPhoto.image_url)}
          alt={coverPhoto.analysis?.memory_caption || coverPhoto.filename}
        />
      ) : (
        <div className="trip-cover-empty" aria-hidden="true">
          <ImagePlus size={30} />
        </div>
      )}
      <div className="trip-cover-scrim" />
      <div className="trip-cover-content">
        <span className="soft-kicker">Private trip memory</span>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="cover-stats">
          <span>
            <strong>{photoCount}</strong>
            Photos
          </span>
          <span>
            <strong>{locatedCount}</strong>
            Places
          </span>
          <span>
            <strong>{analyzedCount}</strong>
            Memories
          </span>
        </div>
        <div className="cover-actions">
          <button
            className="cover-primary"
            type="button"
            disabled={analyzeDisabled}
            onClick={onAnalyze}
          >
            <Sparkles size={17} aria-hidden="true" />
            <span>{buttonLabel}</span>
          </button>
          <span className="cover-privacy">
            <MapPin size={14} aria-hidden="true" />
            EXIF coordinates only
          </span>
        </div>
      </div>
      {job ? <CoverJob job={job} /> : null}
    </section>
  );
}

function CoverJob({ job }: { job: AnalysisJob }) {
  const percent = jobPercent(job);
  return (
    <div className={`cover-job ${job.status}`}>
      <div>
        <strong>{jobStage(job)}</strong>
        <span>{percent}%</span>
      </div>
      <progress max={100} value={percent} />
      {job.error ? <p>{job.error}</p> : null}
    </div>
  );
}
