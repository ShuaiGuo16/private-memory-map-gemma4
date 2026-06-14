import { CalendarDays, Clock3, Sparkles } from "lucide-react";
import { assetUrl, type Photo } from "../../api/client";

type TimelineProps = {
  photos: Photo[];
  selectedPhotoId: number | null;
  onSelectPhoto: (photoId: number) => void;
};

export function Timeline({ photos, selectedPhotoId, onSelectPhoto }: TimelineProps) {
  return (
    <section className="timeline-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Sequence</span>
          <h2>Timeline</h2>
        </div>
        <CalendarDays size={18} aria-hidden="true" />
      </div>
      <div className="timeline-list">
        {photos.length === 0 ? (
          <div className="empty-state compact">
            <Clock3 size={20} aria-hidden="true" />
            <p>No photos uploaded yet.</p>
          </div>
        ) : (
          photos.map((photo) => (
            <button
              key={photo.id}
              className={photo.id === selectedPhotoId ? "selected" : ""}
              onClick={() => onSelectPhoto(photo.id)}
              type="button"
            >
              <img src={assetUrl(photo.image_url)} alt="" />
              <span>
                <em>{formatDate(photo.captured_at ?? photo.created_at)}</em>
                <strong>{photo.analysis?.memory_caption || photo.filename}</strong>
                <small>
                  {photo.analysis ? (
                    <>
                      <Sparkles size={12} aria-hidden="true" />
                      Remembered
                    </>
                  ) : (
                    "Waiting for Gemma"
                  )}
                </small>
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
