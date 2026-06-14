import { FormEvent, useState } from "react";
import { BrainCircuit, CircleAlert, MessageSquareText, Send, Sparkles } from "lucide-react";
import type {
  AnalysisJob,
  AskResponse,
  HealthResponse,
  TripMemory
} from "../../api/client";

type InsightsPanelProps = {
  health: HealthResponse | null;
  healthError: string | null;
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
  const jobRunning = job?.status === "queued" || job?.status === "running";
  const suggestedQuestions = [
    "What did I seem drawn to on this trip?",
    "Which moments were most memorable?",
    "What should I revisit next time?"
  ];

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
          <span className="eyebrow">Steps 3 and 4</span>
          <h2>Gemma memory engine</h2>
          <p>{health ? `${health.database} memory store ready` : healthError ?? "Offline"}</p>
        </div>
        <button
          className="magic-action"
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

      <div className="question-prompts" aria-label="Suggested questions">
        {suggestedQuestions.map((item) => (
          <button
            key={item}
            type="button"
            disabled={askDisabled}
            onClick={() => setQuestion(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <form className="ask-form" onSubmit={handleSubmit}>
        <MessageSquareText size={17} aria-hidden="true" />
        <input
          aria-label="Ask a grounded trip question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this trip..."
          disabled={askDisabled}
        />
        <button type="submit" disabled={askDisabled || !question.trim()} title="Ask trip">
          <Send size={16} aria-hidden="true" />
        </button>
      </form>

      <div className="answer-box">
        {askResponse ? (
          <>
            <span className="answer-label">Grounded answer</span>
            <p>{askResponse.answer}</p>
            <EvidenceButtons
              ids={askResponse.evidence_photo_ids}
              onSelectEvidence={onSelectEvidence}
            />
          </>
        ) : (
          <div className="answer-empty">
            <BrainCircuit size={20} aria-hidden="true" />
            <p>
              {jobRunning
                ? "Working..."
                : "Analyze this trip first, then ask Gemma to reason over the memories."}
            </p>
          </div>
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
        <span>{percent}%</span>
      </div>
      <progress max={100} value={percent} />
      {job.error ? (
        <p>
          <CircleAlert size={14} aria-hidden="true" />
          {job.error}
        </p>
      ) : (
        <em>{job.status}</em>
      )}
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
        <Sparkles size={20} aria-hidden="true" />
        <div>
          <strong>No trip memory yet</strong>
          <p>Run analysis after importing photos. Gemma will synthesize themes, moments, and evidence IDs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-memory">
      <span className="answer-label">Trip synthesis</span>
      <p>{memory.narrative_summary}</p>
      <ChipList values={memory.inferred_interests} />
      <ThemeList values={memory.recurring_themes} />
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
      {memory.uncertainty_notes.length > 0 ? (
        <p className="uncertainty compact">
          <CircleAlert size={14} aria-hidden="true" />
          {memory.uncertainty_notes.join(" ")}
        </p>
      ) : null}
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

function ThemeList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="theme-list">
      {values.slice(0, 4).map((value) => (
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
