
import { getAdminSiteSettings } from "@/lib/actions";
import { getSiteImagesDirect } from "@/lib/supabase";
import SettingsForm from "@/components/admin/SettingsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notFound } from "next/navigation";
import TestsTab from "@/components/admin/TestsTab";
import { Settings } from "lucide-react";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const settings = await getAdminSiteSettings();
  const siteImages = await getSiteImagesDirect();
  const { tab: tabParam } = await searchParams;
  const tab = tabParam || 'general';

  const validTabs = ['general', 'invoice', 'redirects', 'banners', 'tests'];
  if (!validTabs.includes(tab)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#137fec]" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">Manage your site's global configuration and preferences.</p>
      </div>

      <Tabs defaultValue={tab} className="w-full space-y-6">
        <TabsList className="bg-white/5 border border-white/5 p-1 h-auto flex flex-wrap gap-1 w-full justify-start rounded-xl">
          <TabsTrigger value="general" className="data-[state=active]:bg-[#137fec] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/5 px-4 py-2 h-9 rounded-lg transition-all">General & SEO</TabsTrigger>
          <TabsTrigger value="invoice" className="data-[state=active]:bg-[#137fec] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/5 px-4 py-2 h-9 rounded-lg transition-all">Invoice & Checkout</TabsTrigger>
          <TabsTrigger value="redirects" className="data-[state=active]:bg-[#137fec] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/5 px-4 py-2 h-9 rounded-lg transition-all">Redirects</TabsTrigger>
          <TabsTrigger value="banners" className="data-[state=active]:bg-[#137fec] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/5 px-4 py-2 h-9 rounded-lg transition-all">Banners</TabsTrigger>
          <TabsTrigger value="tests" className="data-[state=active]:bg-[#137fec] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/5 px-4 py-2 h-9 rounded-lg transition-all">System Tests</TabsTrigger>
        </TabsList>

        <div className="min-h-[60vh]">
          <TabsContent value="general" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SettingsForm settings={settings} siteImages={siteImages} mode="generalOnly" />
          </TabsContent>
          <TabsContent value="invoice" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SettingsForm settings={settings} siteImages={siteImages} mode="invoiceOnly" />
          </TabsContent>
          <TabsContent value="redirects" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SettingsForm settings={settings} siteImages={siteImages} mode="redirectsOnly" />
          </TabsContent>
          <TabsContent value="banners" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SettingsForm settings={settings} siteImages={siteImages} mode="bannersOnly" />
          </TabsContent>
          <TabsContent value="tests" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TestsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
