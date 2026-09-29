import PlaceholderPage from "@/components/PlaceholderPage";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Lessons"} description={"Create and organize lessons within LMS courses."} icon={BookOpen} />;
}
