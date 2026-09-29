import PlaceholderPage from "@/components/PlaceholderPage";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Results"} description={"Enter and publish exam results per class/subject."} action={"Enter Results"} actionHref={"/exams/results"} icon={Trophy} />;
}
