import { Aperture, Camera, Info, MapPin, Sparkles } from "lucide-react";
import { assetUrl, type Photo } from "../../api/client";

type PhotoDetailProps = {
  photo: Photo | null;
};

export function PhotoDetail({ photo }: PhotoDetailProps) {
  if (!photo) {
    return (
      <section className="photo-panel empty">
        <span className="empty-illustration">
          <Camera size={30} aria-hidden="true" />
        </span>
        <div>
          <h2>No photo selected</h2>
          <p>Select a timeline item or upload photos to begin.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="photo-panel">
      <div className="photo-stage">
        <img src={assetUrl(photo.image_url)} alt={photo.filename} />
        <div className="photo-stage-overlay">
          <span>
            <Aperture size={14} aria-hidden="true" />
            {photo.analysis?.place_type || "Unanalyzed photo"}
          </span>
        </div>
      </div>
      <div className="photo-meta">
        <div>
          <span className="eyebrow">Selected memory</span>
          <h2>{photo.filename}</h2>
          <p>{formatDate(photo.captured_at ?? photo.created_at)}</p>
        </div>
        <span className="location-chip">
          <MapPin size={14} aria-hidden="true" />
          {photo.latitude !== null && photo.longitude !== null
            ? `${photo.latitude.toFixed(4)}, ${photo.longitude.toFixed(4)}`
            : "No GPS"}
        </span>
      </div>
      <div className="analysis-block">
        <div className="analysis-title">
          <Sparkles size={18} aria-hidden="true" />
          <h3>{photo.analysis?.memory_caption || "Analysis pending"}</h3>
        </div>
        <p>{photo.analysis?.scene_summary || "Run the Gemma workflow to turn this image into a grounded memory."}</p>
        {photo.analysis ? (
          <>
            <div className="analysis-facts">
              <span>{photo.analysis.place_type || "place unknown"}</span>
              <span>{photo.analysis.mood}</span>
              <span>{Math.round(photo.analysis.confidence * 100)}% confidence</span>
            </div>
            <TagGroup title="Activities" values={photo.analysis.visible_activities} />
            <TagGroup title="Objects" values={photo.analysis.visible_objects} />
            <TagGroup title="Sensory details" values={photo.analysis.sensory_details} />
            <TagGroup title="Interests" values={photo.analysis.inferred_interest_signals} />
            {photo.analysis.uncertainty_notes.length > 0 ? (
              <p className="uncertainty">
                <Info size={14} aria-hidden="true" />
                {photo.analysis.uncertainty_notes.join(" ")}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

function TagGroup({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="tag-group">
      <span>{title}</span>
      <div>
        {values.slice(0, 8).map((value) => (
          <em key={value}>{value}</em>
        ))}
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
