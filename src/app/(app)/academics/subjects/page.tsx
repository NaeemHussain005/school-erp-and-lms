import PlaceholderPage from "@/components/PlaceholderPage";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Subjects"} description={"Create and manage school subjects."} action={"Add Subject"} actionHref={"/academics/subjects"} icon={BookOpen} />;
}
