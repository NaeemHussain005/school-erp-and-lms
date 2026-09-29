import PlaceholderPage from "@/components/PlaceholderPage";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Fee Invoices"} description={"View and manage all generated fee invoices."} action={"New Invoice"} actionHref={"/fees/invoices/new"} icon={FileText} />;
}
