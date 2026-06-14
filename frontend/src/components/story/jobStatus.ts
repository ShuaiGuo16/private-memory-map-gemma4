import type { AnalysisJob } from "../../api/client";

export function jobPercent(job: AnalysisJob): number {
  if (job.total_steps > 0) {
    return Math.round((job.completed_steps / job.total_steps) * 100);
  }
  return job.status === "completed" ? 100 : 0;
}

export function jobStage(job: AnalysisJob): string {
  if (job.status === "completed") {
    return "Ready";
  }
  if (job.status === "failed") {
    return "Needs attention";
  }
  if (job.completed_steps <= 0) {
    return "Reading photos";
  }
  if (job.total_steps > 0 && job.completed_steps >= job.total_steps - 1) {
    return "Writing trip memory";
  }
  return "Finding moments";
}
