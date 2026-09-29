import PlaceholderPage from "@/components/PlaceholderPage";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Departments"} description={"Organize subjects and staff into departments."} action={"Add Department"} actionHref={"/academics/departments"} icon={Building2} />;
}
