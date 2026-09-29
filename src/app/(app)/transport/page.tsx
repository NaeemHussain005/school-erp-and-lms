import PlaceholderPage from "@/components/PlaceholderPage";
import { Bus } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Transport Management"} description={"Manage vehicles, drivers, routes and stops."} icon={Bus} />;
}
