import { Camera, CircleAlert, Sparkles } from "lucide-react";
import { assetUrl, type Photo, type TripMemory } from "../../api/client";

type MemoryStoryProps = {
  memory: TripMemory | null;
  photos: Photo[];
  selectedPhoto: Photo | null;
  selectedPhotoId: number | null;
  spotlightPhotoId: number | null;
  onSelectPhoto: (photoId: number) => void;
  onSelectEvidence: (photoId: number) => void;
};

export function MemoryStory({
  memory,
  photos,
  selectedPhoto,
  selectedPhotoId,
  spotlightPhotoId,
  onSelectPhoto,
  onSelectEvidence
}: MemoryStoryProps) {
  const analyzedPhotos = photos.filter((photo) => photo.analysis !== null);

  return (
    <section className="story-view">
      {memory ? (
        <article className="story-narrative">
          <span className="soft-kicker">Trip story</span>
          <h2>{memory.narrative_summary}</h2>
          <ChipList values={memory.inferred_interests} />
          <ThemeList values={memory.recurring_themes} />
          <EvidenceTrail
            ids={memory.evidence_photo_ids}
            photos={photos}
            onSelectEvidence={onSelectEvidence}
          />
          {memory.uncertainty_notes.length > 0 ? (
            <p className="soft-warning">
              <CircleAlert size={15} aria-hidden="true" />
              {memory.uncertainty_notes.join(" ")}
            </p>
          ) : null}
        </article>
      ) : (
        <article className="story-narrative empty">
          <Sparkles size={24} aria-hidden="true" />
          <div>
            <span className="soft-kicker">Trip story</span>
            <h2>Memories will gather here.</h2>
            <p>
              Import photos, then develop memories. The story view will collect
              the trip summary, recurring themes, and evidence-backed moments.
            </p>
          </div>
        </article>
      )}

      {memory?.memorable_moments.length ? (
        <section className="moment-gallery" aria-label="Memorable moments">
          {memory.memorable_moments.map((moment) => (
            <article key={moment.title} className="moment-card">
              <span className="soft-kicker">Moment</span>
              <h3>{moment.title}</h3>
              <p>{moment.description}</p>
              <EvidenceTrail
                ids={moment.evidence_photo_ids}
                photos={photos}
                onSelectEvidence={onSelectEvidence}
              />
            </article>
          ))}
        </section>
      ) : null}

      <section className="selected-memory">
        <div className="section-heading">
          <div>
            <span className="soft-kicker">Selected photo</span>
            <h2>Memory detail</h2>
          </div>
        </div>
        {selectedPhoto ? (
          <MemoryPhotoCard
            photo={selectedPhoto}
            selected
            spotlight={spotlightPhotoId === selectedPhoto.id}
            onSelectPhoto={onSelectPhoto}
          />
        ) : (
          <div className="empty-memory-card">
            <Camera size={24} aria-hidden="true" />
            <p>Select a photo to read its memory.</p>
          </div>
        )}
      </section>

      <section className="photo-memory-strip">
        <div className="section-heading">
          <div>
            <span className="soft-kicker">Photo memories</span>
            <h2>{analyzedPhotos.length > 0 ? "Remembered photos" : "Waiting for analysis"}</h2>
          </div>
        </div>
        {analyzedPhotos.length > 0 ? (
          <div className="memory-card-grid">
            {analyzedPhotos.slice(0, 6).map((photo) => (
              <MemoryPhotoCard
                key={photo.id}
                photo={photo}
                selected={photo.id === selectedPhotoId}
                spotlight={photo.id === spotlightPhotoId}
                onSelectPhoto={onSelectPhoto}
              />
            ))}
          </div>
        ) : (
          <div className="empty-memory-card">
            <Sparkles size={22} aria-hidden="true" />
            <p>Develop memories to turn imported photos into captions and reflections.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function MemoryPhotoCard({
  photo,
  selected,
  spotlight,
  onSelectPhoto
}: {
  photo: Photo;
  selected?: boolean;
  spotlight?: boolean;
  onSelectPhoto: (photoId: number) => void;
}) {
  const analysis = photo.analysis;

  return (
    <article className={`memory-photo-card ${selected ? "selected" : ""} ${spotlight ? "spotlight" : ""}`}>
      <button type="button" onClick={() => onSelectPhoto(photo.id)}>
        <img src={assetUrl(photo.image_url)} alt={analysis?.memory_caption || photo.filename} />
      </button>
      <div>
        <span>{formatDate(photo.captured_at ?? photo.created_at)}</span>
        <h3>{analysis?.memory_caption || photo.filename}</h3>
        <p>{analysis?.scene_summary || "This photo is ready to be developed into a memory."}</p>
        {analysis ? (
          <>
            <div className="memory-facts">
              <em>{analysis.place_type || "place unknown"}</em>
              <em>{analysis.mood}</em>
              <em>{Math.round(analysis.confidence * 100)}% confidence</em>
            </div>
            <details className="memory-details">
              <summary>Details</summary>
              <TagGroup title="Activities" values={analysis.visible_activities} />
              <TagGroup title="Objects" values={analysis.visible_objects} />
              <TagGroup title="Sensory" values={analysis.sensory_details} />
              <TagGroup title="Interests" values={analysis.inferred_interest_signals} />
              {analysis.uncertainty_notes.length > 0 ? (
                <p className="soft-warning">{analysis.uncertainty_notes.join(" ")}</p>
              ) : null}
            </details>
          </>
        ) : null}
      </div>
    </article>
  );
}

function EvidenceTrail({
  ids,
  photos,
  onSelectEvidence
}: {
  ids: number[];
  photos: Photo[];
  onSelectEvidence: (photoId: number) => void;
}) {
  if (ids.length === 0) {
    return null;
  }

  return (
    <div className="evidence-trail">
      <span>Evidence</span>
      {ids.map((id) => {
        const photo = photos.find((item) => item.id === id);
        return (
          <button key={id} type="button" onClick={() => onSelectEvidence(id)}>
            {photo ? <img src={assetUrl(photo.image_url)} alt="" /> : null}
            <em>#{id}</em>
          </button>
        );
      })}
    </div>
  );
}

function ChipList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return null;
  }
  return (
    <div className="story-chip-list">
      {values.slice(0, 8).map((value) => (
        <span key={value}>{value}</span>
      ))}
    </div>
  );
}

function ThemeList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return null;
  }
  return (
    <div className="story-theme-list">
      {values.slice(0, 5).map((value) => (
        <span key={value}>{value}</span>
      ))}
    </div>
  );
}

function TagGroup({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) {
    return null;
  }
  return (
    <div className="story-tag-group">
      <span>{title}</span>
      <div>
        {values.slice(0, 6).map((value) => (
          <em key={value}>{value}</em>
        ))}
      </div>
    </div>
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
