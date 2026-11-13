import { StudyRoom } from "@/components/academy/study-room";
import {
  LESSON_TITLE,
  LESSON_SUBTITLE,
  studySteps,
} from "@/lib/academy/content";
import { publicQuestions } from "@/lib/academy/questions";
export const metadata = { title: LESSON_TITLE, description: LESSON_SUBTITLE };
export default function Lesson() {
  return (
    <div className="container page-content">
      <StudyRoom
        questions={Object.fromEntries(
          studySteps.map((s) => [s.id, publicQuestions(s.id)]),
        )}
      />
    </div>
  );
}
