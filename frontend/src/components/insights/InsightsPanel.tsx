import { FormEvent, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import type {
  AnalysisJob,
  AskResponse,
  HealthResponse,
  TripMemory
} from "../../api/client";

type InsightsPanelProps = {
  health: HealthResponse | null;
  healthError: string | null;
  disabled: boolean;
  askDisabled: boolean;
  analyzeDisabled: boolean;
  job: AnalysisJob | null;
  tripMemory: TripMemory | null;
  askResponse: AskResponse | null;
  onAnalyze: () => void;
  onAsk: (question: string) => void;
  onSelectEvidence: (photoId: number) => void;
};

export function InsightsPanel({
  health,
  healthError,
  disabled,
  askDisabled,
  analyzeDisabled,
  job,
  tripMemory,
  askResponse,
  onAnalyze,
  onAsk,
  onSelectEvidence
}: InsightsPanelProps) {
  const [question, setQuestion] = useState("What did I seem drawn to on this trip?");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (question.trim()) {
      onAsk(question.trim());
    }
  }

  return (
    <section className="insights-panel">
      <div className="panel-heading">
        <div>
          <h2>Memory Search</h2>
          <p>{health ? `${health.database} + ${health.storage}` : healthError ?? "Offline"}</p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={analyzeDisabled}
          title="Analyze trip"
        >
          <Sparkles size={16} aria-hidden="true" />
          <span>Analyze</span>
        </button>
      </div>

      {job ? <JobProgress job={job} /> : null}
      <TripMemoryBlock memory={tripMemory} onSelectEvidence={onSelectEvidence} />

      <form className="ask-form" onSubmit={handleSubmit}>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={askDisabled}
        />
        <button type="submit" disabled={askDisabled || !question.trim()} title="Ask trip">
          <Send size={16} aria-hidden="true" />
        </button>
      </form>

      <div className="answer-box">
        {askResponse ? (
          <>
            <p>{askResponse.answer}</p>
            <EvidenceButtons
              ids={askResponse.evidence_photo_ids}
              onSelectEvidence={onSelectEvidence}
            />
          </>
        ) : (
          <p>{disabled ? "Working..." : "Analyze this trip first."}</p>
        )}
      </div>
    </section>
  );
}

function JobProgress({ job }: { job: AnalysisJob }) {
  const percent =
    job.total_steps > 0
      ? Math.round((job.completed_steps / job.total_steps) * 100)
      : job.status === "completed"
        ? 100
        : 0;

  return (
    <div className={`job-progress ${job.status}`}>
      <div>
        <strong>{job.current_step}</strong>
        <span>{job.status}</span>
      </div>
      <progress max={100} value={percent} />
      {job.error ? <p>{job.error}</p> : null}
    </div>
  );
}

function TripMemoryBlock({
  memory,
  onSelectEvidence
}: {
  memory: TripMemory | null;
  onSelectEvidence: (photoId: number) => void;
}) {
  if (!memory) {
    return (
      <div className="trip-memory muted">
        <p>Analyze this trip first.</p>
      </div>
    );
  }

  return (
    <div className="trip-memory">
      <p>{memory.narrative_summary}</p>
      <ChipList values={memory.inferred_interests} />
      <div className="memory-moments">
        {memory.memorable_moments.slice(0, 3).map((moment) => (
          <article key={moment.title}>
            <strong>{moment.title}</strong>
            <p>{moment.description}</p>
            <EvidenceButtons
              ids={moment.evidence_photo_ids}
              onSelectEvidence={onSelectEvidence}
            />
          </article>
        ))}
      </div>
    </div>
  );
}

function ChipList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="chip-list">
      {values.slice(0, 8).map((value) => (
        <span key={value}>{value}</span>
      ))}
    </div>
  );
}

function EvidenceButtons({
  ids,
  onSelectEvidence
}: {
  ids: number[];
  onSelectEvidence: (photoId: number) => void;
}) {
  if (ids.length === 0) {
    return <span>Evidence photos: none</span>;
  }

  return (
    <div className="evidence-buttons">
      <span>Evidence</span>
      {ids.map((id) => (
        <button key={id} type="button" onClick={() => onSelectEvidence(id)}>
          #{id}
        </button>
      ))}
    </div>
  );
}
