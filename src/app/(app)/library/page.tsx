import PlaceholderPage from "@/components/PlaceholderPage";
import { Library } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Library Management"} description={"Track books, issues, returns, fines and members."} action={"Add Book"} actionHref={"/library"} icon={Library} />;
}
