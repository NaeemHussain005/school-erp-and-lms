import PlaceholderPage from "@/components/PlaceholderPage";
import { PieChart } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Report Center"} description={"Generate, filter, and export all school reports."} icon={PieChart} />;
}
