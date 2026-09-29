import PlaceholderPage from "@/components/PlaceholderPage";
import { FileQuestion } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Question Bank"} description={"Reusable questions across exams and papers."} action={"Add Question"} actionHref={"/exams/questions"} icon={FileQuestion} />;
}
