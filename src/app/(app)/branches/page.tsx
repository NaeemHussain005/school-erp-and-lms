import PlaceholderPage from "@/components/PlaceholderPage";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Branches"} description={"Manage multiple campuses/branches from one place."} action={"Add Branch"} actionHref={"/branches"} icon={Building2} />;
}
