import PlaceholderPage from "@/components/PlaceholderPage";
import { Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Payments"} description={"Record and view fee payments and receipts."} action={"Record Payment"} actionHref={"/fees/payments"} icon={Wallet} />;
}
