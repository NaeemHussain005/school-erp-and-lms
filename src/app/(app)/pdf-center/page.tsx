import PlaceholderPage from "@/components/PlaceholderPage";
import { FileDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"PDF Center"} description={"Download and print professional PDFs for every module."} icon={FileDown} />;
}
