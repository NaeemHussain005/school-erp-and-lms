import PlaceholderPage from "@/components/PlaceholderPage";
import { Calculator } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Daily Cash Closing"} description={"End-of-day cash reconciliation and closing report."} icon={Calculator} />;
}
