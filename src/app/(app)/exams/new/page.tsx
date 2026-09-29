import PlaceholderPage from "@/components/PlaceholderPage";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Create Exam"} description={"Create a new exam: mid-term, final, quiz, or monthly test."} icon={ClipboardList} />;
}
