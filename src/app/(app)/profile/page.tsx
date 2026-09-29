import PlaceholderPage from "@/components/PlaceholderPage";
import { UserCog } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlaceholderPage title={"My Profile"} description={"Manage your profile, photo, password and preferences."} icon={UserCog} />;
}
