import PlaceholderPage from "@/components/PlaceholderPage";
import { Library } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Materials Library"} description={"Central library of PDFs, videos, worksheets and past papers."} action={"Upload Material"} actionHref={"/lms/library"} icon={Library} />;
}
