import PlaceholderPage from "@/components/PlaceholderPage";
import { Upload } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Import Data"} description={"Import students, teachers, parents and fees from Excel/CSV."} icon={Upload} />;
}
