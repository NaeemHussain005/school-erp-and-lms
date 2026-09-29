import PlaceholderPage from "@/components/PlaceholderPage";
import { FileBadge } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Certificates Center"} description={"Generate bonafide, character, transfer and other certificates."} icon={FileBadge} />;
}
