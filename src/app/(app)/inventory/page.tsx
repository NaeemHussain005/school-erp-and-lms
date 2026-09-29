import PlaceholderPage from "@/components/PlaceholderPage";
import { Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Inventory"} description={"Track school assets, furniture, equipment and stationery."} action={"Add Item"} actionHref={"/inventory"} icon={Package} />;
}
