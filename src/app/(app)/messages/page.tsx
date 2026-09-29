import PlaceholderPage from "@/components/PlaceholderPage";
import { MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Messages"} description={"In-app messaging for teachers, parents and admins."} icon={MessageSquare} />;
}
