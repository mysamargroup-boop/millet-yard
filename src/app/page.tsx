import HomeClient from '@/components/home/HomeClient';
import { getSiteSettings, getTags, getHomeBundleServer } from '@/lib/data-async';
import { SiteSettings, HomeBundle } from '@/lib/types';

// Server component fetching settings, tags, and full home bundle for instant 0ms SSR paint
export default async function Home() {
  const [settings, tags, initialBundle] = await Promise.all([
    getSiteSettings(),
    getTags(),
    getHomeBundleServer(),
  ]);

  return <HomeClient settings={settings} tags={tags} initialBundle={initialBundle} />;
}
