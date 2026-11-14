import { ChecklistStudyRoom } from "@/components/academy/checklist/study-room";
import {
  LESSON_TITLE,
  LESSON_SUBTITLE,
  steps,
} from "@/lib/academy/checklist/content";
import { publicQuestions } from "@/lib/academy/checklist/questions";
export const metadata = { title: LESSON_TITLE, description: LESSON_SUBTITLE };
export default function Lesson() {
  return (
    <div className="container page-content">
      <ChecklistStudyRoom
        questions={Object.fromEntries(
          steps.map((s) => [s.id, publicQuestions(s.id)]),
        )}
      />
    </div>
  );
}
