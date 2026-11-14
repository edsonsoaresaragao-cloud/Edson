import {
  summarizeProgress,
  type ProgressRepository,
  type StudentProgress,
} from "../../src/lib/academy/checklist/progress";
export function memoryChecklistRepository(): ProgressRepository {
  const users = new Map<string, StudentProgress>();
  return {
    async load(id) {
      return structuredClone(
        users.get(id) || summarizeProgress([], "introducao", false),
      );
    },
    async start(id) {
      if (!users.has(id)) users.set(id, summarizeProgress([]));
    },
    async visit(id, step) {
      users.get(id)!.lastStep = step;
    },
    async complete(id, step, score) {
      const p = users.get(id)!;
      const previous = p.completed.find((s) => s.step === step);
      users.set(
        id,
        summarizeProgress(
          [
            ...p.completed.filter((s) => s.step !== step),
            {
              step,
              score: Math.max(previous?.score || 0, score),
              completedAt: previous?.completedAt || new Date().toISOString(),
            },
          ],
          step,
        ),
      );
    },
  };
}
