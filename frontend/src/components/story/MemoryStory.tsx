import { useEffect, useState } from "react";
import {
  Camera,
  CircleAlert,
  Pin,
  RotateCcw,
  Save,
  Sparkles,
  Star
} from "lucide-react";
import { assetUrl, type Photo, type TripMemory } from "../../api/client";

type MemoryStoryProps = {
  memory: TripMemory | null;
  photos: Photo[];
  selectedPhoto: Photo | null;
  selectedPhotoId: number | null;
  spotlightPhotoId: number | null;
  coverPhotoId: number | null;
  busy: boolean;
  onSelectPhoto: (photoId: number) => void;
  onSelectEvidence: (photoId: number) => void;
  onUpdatePhoto: (
    photoId: number,
    payload: {
      is_favorite?: boolean;
      user_memory_caption?: string | null;
      user_scene_summary?: string | null;
      user_mood?: string | null;
      user_note?: string | null;
    }
  ) => void | Promise<void>;
  onUpdateTripMemory: (payload: {
    user_narrative_summary?: string | null;
    user_note?: string | null;
  }) => void | Promise<void>;
  onSetCover: (photoId: number) => void | Promise<void>;
};

export function MemoryStory({
  memory,
  photos,
  selectedPhoto,
  selectedPhotoId,
  spotlightPhotoId,
  coverPhotoId,
  busy,
  onSelectPhoto,
  onSelectEvidence,
  onUpdatePhoto,
  onUpdateTripMemory,
  onSetCover
}: MemoryStoryProps) {
  const analyzedPhotos = photos.filter((photo) => photo.analysis !== null);
  const favoritePhotos = photos.filter((photo) => photo.is_favorite);

  return (
    <section className="story-view">
      {memory ? (
        <article className="story-narrative">
          <span className="soft-kicker">Trip story</span>
          <h2>{memory.user_narrative_summary || memory.narrative_summary}</h2>
          {memory.user_note ? <p className="memory-user-note">{memory.user_note}</p> : null}
          <ChipList values={memory.inferred_interests} />
          <ThemeList values={memory.recurring_themes} />
          <EvidenceTrail
            ids={memory.evidence_photo_ids}
            photos={photos}
            onSelectEvidence={onSelectEvidence}
          />
          <TripMemoryEditor
            memory={memory}
            disabled={busy}
            onSave={onUpdateTripMemory}
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

      {favoritePhotos.length > 0 ? (
        <section className="photo-memory-strip kept-moments">
          <div className="section-heading">
            <div>
              <span className="soft-kicker">Kept moments</span>
              <h2>Favorites you marked</h2>
            </div>
          </div>
          <div className="memory-card-grid">
            {favoritePhotos.slice(0, 4).map((photo) => (
              <MemoryPhotoCard
                key={photo.id}
                photo={photo}
                selected={photo.id === selectedPhotoId}
                spotlight={photo.id === spotlightPhotoId}
                coverPhotoId={coverPhotoId}
                disabled={busy}
                onSelectPhoto={onSelectPhoto}
                onUpdatePhoto={onUpdatePhoto}
                onSetCover={onSetCover}
              />
            ))}
          </div>
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
            editable
            coverPhotoId={coverPhotoId}
            disabled={busy}
            onSelectPhoto={onSelectPhoto}
            onUpdatePhoto={onUpdatePhoto}
            onSetCover={onSetCover}
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
                coverPhotoId={coverPhotoId}
                disabled={busy}
                onSelectPhoto={onSelectPhoto}
                onUpdatePhoto={onUpdatePhoto}
                onSetCover={onSetCover}
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
  editable,
  coverPhotoId,
  disabled,
  onSelectPhoto,
  onUpdatePhoto,
  onSetCover
}: {
  photo: Photo;
  selected?: boolean;
  spotlight?: boolean;
  editable?: boolean;
  coverPhotoId: number | null;
  disabled: boolean;
  onSelectPhoto: (photoId: number) => void;
  onUpdatePhoto: MemoryStoryProps["onUpdatePhoto"];
  onSetCover: MemoryStoryProps["onSetCover"];
}) {
  const analysis = photo.analysis;
  const mood = analysis?.user_mood || analysis?.mood;

  return (
    <article className={`memory-photo-card ${selected ? "selected" : ""} ${spotlight ? "spotlight" : ""}`}>
      <button
        className="memory-image-button"
        type="button"
        onClick={() => onSelectPhoto(photo.id)}
      >
        <img src={assetUrl(photo.image_url)} alt={analysis?.memory_caption || photo.filename} />
      </button>
      <div>
        <span>{formatDate(photo.captured_at ?? photo.created_at)}</span>
        <h3>{analysis?.memory_caption || photo.filename}</h3>
        <p>{analysis?.scene_summary || "This photo is ready to be developed into a memory."}</p>
        <div className="memory-actions">
          <button
            type="button"
            className={photo.is_favorite ? "active" : ""}
            disabled={disabled}
            onClick={() => onUpdatePhoto(photo.id, { is_favorite: !photo.is_favorite })}
            title={photo.is_favorite ? "Remove from kept moments" : "Keep this moment"}
          >
            <Star size={14} aria-hidden="true" />
            <span>{photo.is_favorite ? "Kept" : "Keep"}</span>
          </button>
          <button
            type="button"
            className={coverPhotoId === photo.id ? "active" : ""}
            disabled={disabled || coverPhotoId === photo.id}
            onClick={() => onSetCover(photo.id)}
            title="Use this photo as cover"
          >
            <Pin size={14} aria-hidden="true" />
            <span>{coverPhotoId === photo.id ? "Cover" : "Cover"}</span>
          </button>
        </div>
        {analysis ? (
          <>
            <div className="memory-facts">
              <em>{analysis.place_type || "place unknown"}</em>
              <em>{mood}</em>
              <em>{Math.round(analysis.confidence * 100)}% confidence</em>
            </div>
            {analysis.user_note ? <p className="memory-user-note">{analysis.user_note}</p> : null}
            {editable ? (
              <PhotoMemoryEditor
                photo={photo}
                disabled={disabled}
                onSave={onUpdatePhoto}
              />
            ) : null}
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

function TripMemoryEditor({
  memory,
  disabled,
  onSave
}: {
  memory: TripMemory;
  disabled: boolean;
  onSave: MemoryStoryProps["onUpdateTripMemory"];
}) {
  const [summary, setSummary] = useState(
    memory.user_narrative_summary || memory.narrative_summary
  );
  const [note, setNote] = useState(memory.user_note ?? "");

  useEffect(() => {
    setSummary(memory.user_narrative_summary || memory.narrative_summary);
    setNote(memory.user_note ?? "");
  }, [
    memory.trip_id,
    memory.narrative_summary,
    memory.user_narrative_summary,
    memory.user_note
  ]);

  return (
    <details className="memory-editor">
      <summary>Refine story</summary>
      <label>
        <span>Story</span>
        <textarea
          value={summary}
          disabled={disabled}
          rows={4}
          onChange={(event) => setSummary(event.target.value)}
        />
      </label>
      <label>
        <span>Private note</span>
        <textarea
          value={note}
          disabled={disabled}
          rows={3}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <div className="editor-actions">
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onSave({
              user_narrative_summary: summary.trim() || null,
              user_note: note.trim() || null
            })
          }
        >
          <Save size={14} aria-hidden="true" />
          <span>Save</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onSave({ user_narrative_summary: null, user_note: null })
          }
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>
    </details>
  );
}

function PhotoMemoryEditor({
  photo,
  disabled,
  onSave
}: {
  photo: Photo;
  disabled: boolean;
  onSave: MemoryStoryProps["onUpdatePhoto"];
}) {
  const analysis = photo.analysis;
  const [caption, setCaption] = useState(analysis?.memory_caption ?? "");
  const [scene, setScene] = useState(analysis?.scene_summary ?? "");
  const [mood, setMood] = useState(analysis?.user_mood || analysis?.mood || "");
  const [note, setNote] = useState(analysis?.user_note ?? "");

  useEffect(() => {
    setCaption(analysis?.memory_caption ?? "");
    setScene(analysis?.scene_summary ?? "");
    setMood(analysis?.user_mood || analysis?.mood || "");
    setNote(analysis?.user_note ?? "");
  }, [
    photo.id,
    analysis?.memory_caption,
    analysis?.scene_summary,
    analysis?.user_mood,
    analysis?.mood,
    analysis?.user_note
  ]);

  if (!analysis) {
    return null;
  }

  return (
    <details className="memory-editor">
      <summary>Refine photo memory</summary>
      <label>
        <span>Caption</span>
        <input
          value={caption}
          disabled={disabled}
          onChange={(event) => setCaption(event.target.value)}
        />
      </label>
      <label>
        <span>Scene</span>
        <textarea
          value={scene}
          disabled={disabled}
          rows={3}
          onChange={(event) => setScene(event.target.value)}
        />
      </label>
      <label>
        <span>Mood</span>
        <input
          value={mood}
          disabled={disabled}
          onChange={(event) => setMood(event.target.value)}
        />
      </label>
      <label>
        <span>Private note</span>
        <textarea
          value={note}
          disabled={disabled}
          rows={3}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <div className="editor-actions">
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onSave(photo.id, {
              user_memory_caption: caption.trim() || null,
              user_scene_summary: scene.trim() || null,
              user_mood: mood.trim() || null,
              user_note: note.trim() || null
            })
          }
        >
          <Save size={14} aria-hidden="true" />
          <span>Save</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onSave(photo.id, {
              user_memory_caption: null,
              user_scene_summary: null,
              user_mood: null,
              user_note: null
            })
          }
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>
    </details>
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
