import { Camera, MapPin } from "lucide-react";
import { assetUrl, type Photo } from "../../api/client";

type PhotoDetailProps = {
  photo: Photo | null;
};

export function PhotoDetail({ photo }: PhotoDetailProps) {
  if (!photo) {
    return (
      <section className="photo-panel empty">
        <Camera size={28} aria-hidden="true" />
        <p>No selected photo</p>
      </section>
    );
  }

  return (
    <section className="photo-panel">
      <img src={assetUrl(photo.image_url)} alt={photo.filename} />
      <div className="photo-meta">
        <div>
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
        <h3>{photo.analysis?.memory_caption || "Analysis pending"}</h3>
        <p>{photo.analysis?.scene_summary || "No memory prompt yet."}</p>
        {photo.analysis ? (
          <>
            <div className="analysis-facts">
              <span>{photo.analysis.place_type || "place unknown"}</span>
              <span>{photo.analysis.mood}</span>
              <span>{Math.round(photo.analysis.confidence * 100)}% confidence</span>
            </div>
            <TagGroup title="Activities" values={photo.analysis.visible_activities} />
            <TagGroup title="Objects" values={photo.analysis.visible_objects} />
            <TagGroup title="Interests" values={photo.analysis.inferred_interest_signals} />
            {photo.analysis.uncertainty_notes.length > 0 ? (
              <p className="uncertainty">{photo.analysis.uncertainty_notes.join(" ")}</p>
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
