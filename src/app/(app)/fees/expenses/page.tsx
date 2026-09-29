import PlaceholderPage from "@/components/PlaceholderPage";
import { TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Expenses"} description={"Track school expenses and daily cash outflows."} action={"Add Expense"} actionHref={"/fees/expenses"} icon={TrendingDown} />;
}
