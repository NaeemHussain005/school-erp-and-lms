import PlaceholderPage from "@/components/PlaceholderPage";
import { Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Fee Categories"} description={"Define fee types like tuition, transport, exam fees."} action={"Add Category"} actionHref={"/fees/categories"} icon={Receipt} />;
}
