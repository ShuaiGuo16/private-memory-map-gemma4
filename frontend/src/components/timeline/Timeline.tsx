import { CalendarDays } from "lucide-react";
import type { Photo } from "../../api/client";

type TimelineProps = {
  photos: Photo[];
  selectedPhotoId: number | null;
  onSelectPhoto: (photoId: number) => void;
};

export function Timeline({ photos, selectedPhotoId, onSelectPhoto }: TimelineProps) {
  return (
    <section className="timeline-panel">
      <div className="panel-heading">
        <h2>Timeline</h2>
        <CalendarDays size={18} aria-hidden="true" />
      </div>
      <div className="timeline-list">
        {photos.length === 0 ? (
          <p className="empty-copy">No photos uploaded</p>
        ) : (
          photos.map((photo) => (
            <button
              key={photo.id}
              className={photo.id === selectedPhotoId ? "selected" : ""}
              onClick={() => onSelectPhoto(photo.id)}
              type="button"
            >
              <span>{formatDate(photo.captured_at ?? photo.created_at)}</span>
              <strong>{photo.analysis?.memory_caption || photo.filename}</strong>
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
