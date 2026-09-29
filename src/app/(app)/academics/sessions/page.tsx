import PlaceholderPage from "@/components/PlaceholderPage";
import { Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Academic Sessions"} description={"Manage academic years. Previous years remain accessible."} action={"New Session"} actionHref={"/academics/sessions"} icon={Calendar} />;
}
