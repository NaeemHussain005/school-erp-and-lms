import PlaceholderPage from "@/components/PlaceholderPage";
import { Upload } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Import Students"} description={"Upload Excel or CSV files to bulk-import students."} icon={Upload} />;
}
