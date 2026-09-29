import PlaceholderPage from "@/components/PlaceholderPage";
import { Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Calendar & Events"} description={"Holidays, exams, events, and important dates."} action={"Add Event"} actionHref={"/calendar"} icon={Calendar} />;
}
