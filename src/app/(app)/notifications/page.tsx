import PlaceholderPage from "@/components/PlaceholderPage";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"Notifications"} description={"View all your notifications in one place."} icon={Bell} />;
}
