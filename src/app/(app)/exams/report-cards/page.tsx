import PlaceholderPage from "@/components/PlaceholderPage";
import { Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Report Cards"} description={"Generate beautiful PDF report cards."} icon={Award} />;
}
