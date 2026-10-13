import Image from 'next/image';
import { BLUR_DATA_URL } from '@/lib/constants';
import { Sprout, Heart, ShieldCheck, Award, Users, Wheat } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Our Story | Millet Yard - Heritage Shree Anna & Native Farming',
  description: 'Learn how Millet Yard is reviving ancient Indian millets (Shree Anna), partnering directly with tribal farmer cooperatives, and bringing 100% unpolished, cold stone-ground superfoods to your dining table.',
};

const Highlight = ({ children }: { children: React.ReactNode }) => (
  <span className="font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800 bg-clip-text text-transparent">
    {children}
  </span>
);

export default function OurStoryPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>Rooted in Vedic Heritage & Soil Health</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 bg-clip-text text-transparent">
            The Story Behind Millet Yard
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Reviving Ancient Shree Anna Grains, Nurturing Native Soil, and Healing Modern Lifestyles
          </p>
        </header>

        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8 not-prose">
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center">
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">100%</div>
            <div className="text-xs font-medium text-muted-foreground mt-0.5">Unpolished & Chemical-Free</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center">
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">8+</div>
            <div className="text-xs font-medium text-muted-foreground mt-0.5">Shree Anna Supergrains</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center">
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">1,200+</div>
            <div className="text-xs font-medium text-muted-foreground mt-0.5">Tribal Farmers Supported</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center">
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">0%</div>
            <div className="text-xs font-medium text-muted-foreground mt-0.5">Refined Preservatives</div>
          </div>
        </div>

        <article className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed space-y-5 [&_p]:mb-3">
          <p>
            The birth of <Highlight>Millet Yard</Highlight> did not begin in an urban boardroom—it began in the sun-drenched, red-loam soil of traditional farming hamlets where elders recounted tales of generations who lived past a century with robust vitality, boundless energy, and razor-sharp minds. Their secret wasn't synthetic supplements or processed health powders. It was simply the daily staple of <Highlight>Shree Anna</Highlight>—the timeless positive millets of ancient India.
          </p>

          <div className="flex flex-col md:flex-row gap-8 items-center not-prose my-12 bg-card p-6 md:p-8 rounded-3xl border shadow-sm">
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden flex-shrink-0 shadow-md border-2 border-emerald-600/20 bg-emerald-50 flex items-center justify-center p-4">
              <Image
                src="/logo.png"
                alt="Millet Yard Logo"
                width={160}
                height={160}
                className="object-contain"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            </div>
            <blockquote className="border-l-4 border-emerald-600 pl-6 italic text-muted-foreground text-sm md:text-base leading-relaxed">
              &quot;Food is not merely fuel; when grown with reverence and eaten unpolished, whole grain is nature’s most potent medicine. At Millet Yard, our commitment is simple: if nature didn’t put it in the seed, we won’t add it, and if nature gave it to the grain, we will never strip it away.&quot;
              <cite className="block not-italic mt-2.5 font-semibold text-xs sm:text-sm text-emerald-800 dark:text-emerald-400">
                — The Millet Yard Collective & Agronomist Council
              </cite>
            </blockquote>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-foreground mt-8">The Forgotten Heritage of Shree Anna</h2>
          <p>
            For thousands of years, grains like <Highlight>Kodo (कोदो), Kutki (Little Millet), Kangni (Foxtail), Sanwa (Barnyard), and Browntop (मुरत)</Highlight> sustained our ancestors. They required minimal groundwater, thrived without chemical pesticides, and enriched the earth rather than depleting it.
          </p>
          <p>
            Over the last few decades, rapid industrial agriculture displaced these supergrains in favor of hyper-refined, polished white wheat and paddy rice. Along with this shift came a modern epidemic of insulin resistance, diabetes, chronic gut inflammation, and fatigue. Millet Yard was founded with an uncompromising mission: to restore real, whole-grain nutrition to every Indian household.
          </p>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose my-10">
            <div className="p-6 rounded-2xl border bg-card/60 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-4 text-emerald-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">100% Unpolished</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Commercial mills polish millets to make them glossy, stripping away 80% of micro-nutrients. We retain the entire nutrient-dense outer aleurone layer and natural bran.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card/60 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-4 text-emerald-700">
                <Wheat className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Slow Stone-Ground</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                High-speed industrial steel rollers overheat and denature flour vitamins. Our flours are gently ground on slow stone chakki at cool temperatures to lock in living enzymes.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card/60 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-4 text-emerald-700">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Farmer First</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We work directly with certified tribal farmer producer organizations (FPOs) and women self-help groups, cutting out predatory middlemen and paying ethical fair prices.
              </p>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-8">From Soil to Your Plate</h2>
          <p>
            Every single pack from <Highlight>Millet Yard</Highlight> is vacuum-sealed or nitrogen-flushed for natural freshness without synthetic fumigants or anti-caking chemicals. Whether you are managing blood sugar, strengthening your bone density with calcium-packed Ragi, or seeking wholesome gut-soothing fiber, we make the transition effortless with ready recipes, certified flours, and versatile superfood blends.
          </p>

          <p>
            Thank you for being part of this movement. Every meal you prepare with Millet Yard is a vote for regenerative farming, thriving rural livelihoods, and clean, uncompromised health for your family.
          </p>

          <div className="pt-6 not-prose text-center flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="rounded-full bg-emerald-700 hover:bg-emerald-800 text-white px-8">
              <Link href="/collections/all">Explore Pure Shree Anna Millets</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-emerald-600/30 text-emerald-800 dark:text-emerald-300">
              <Link href="/blog">Read Nutrition & Recipe Guides</Link>
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}
