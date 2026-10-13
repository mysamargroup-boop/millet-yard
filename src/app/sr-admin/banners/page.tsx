
import { getAdminSiteSettings } from "@/lib/actions";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function BannersPage() {
  const settings = await getAdminSiteSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Banners & Hero</h1>
        <p className="text-muted-foreground">Manage your homepage hero section and other promotional banners.</p>
      </div>
      <SettingsForm settings={settings} mode="bannersOnly" />
    </div>
  );
}
