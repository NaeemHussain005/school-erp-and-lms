import PlaceholderPage from "@/components/PlaceholderPage";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Audit Log"} description={"Track important actions performed by users."} icon={FileText} />;
}
