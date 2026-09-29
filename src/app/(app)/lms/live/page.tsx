import PlaceholderPage from "@/components/PlaceholderPage";
import { Video } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Live Classes"} description={"Schedule and join online classes via any video provider."} action={"Schedule Live Class"} actionHref={"/lms/live"} icon={Video} />;
}
