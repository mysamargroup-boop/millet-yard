
import Image from "next/image";
import { getSiteImages } from "@/lib/data-async";
import { updateSiteImage } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { unstable_noStore as noStore } from "next/cache";
import { BLUR_DATA_URL } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ImageIcon, Save } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { AddSiteImageDialog } from "@/components/admin/AddSiteImageDialog";


const usageMap: { [key: string]: string } = {
  'promo-banner-delivery': 'Homepage small banner (e.g., Free Delivery).',
  'slider-xmas': 'Homepage slider: Christmas.',
  'slider-anniversary': 'Homepage slider: Anniversary.',
  'slider-birthday': 'Homepage slider: Birthday.',
  'grid-anniversary': 'Homepage grid: Anniversary.',
  'grid-birthday': 'Homepage grid: Birthday.',
  'grid-personalized': 'Homepage grid: Personalized.',
  'grid-corporate': 'Homepage grid: Corporate.',
  'grid-walldecor': 'Homepage grid: Wall Decor.',
  'grid-deskitem': 'Homepage grid: Desk Items.',
  'grid-bestseller': 'Homepage grid: Best Sellers.',
  'grid-allgifts': 'Homepage grid: All Gifts.',
  'our-story-workshop': 'Main image on the "Our Story" page.',
  'hero-desktop': 'Main Desktop Hero Banner.',
  'hero-mobile': 'Main Mobile Hero Banner.',
};

function ImageCard({ image }: { image: { id: string; imageUrl: string; description: string; imageHint?: string; name?: string; buttonText?: string; linkUrl?: string; } }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden h-full flex flex-col">
      <form action={updateSiteImage} className="flex flex-col h-full">
        <input type="hidden" name="id" value={image.id} />
        <div className="p-4 border-b border-white/5 bg-white/5">
          <div className="flex flex-col gap-2">
            <h3 className="font-mono text-xs font-semibold text-[#137fec] break-all">{image.id}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">
              {usageMap[image.id] || (image.id.startsWith('hero-') ? 'Hero Slider Image' : image.description)}
            </p>
          </div>
        </div>

        <div className="p-4 flex-1 space-y-4">
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-white/10 bg-black/20 group">
            <Image
              src={image.imageUrl}
              alt={image.description}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              data-ai-hint={image.imageHint}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">View Full</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`imageUrl-${image.id}`} className="text-xs">Image URL</Label>
              <Input id={`imageUrl-${image.id}`} name="imageUrl" defaultValue={image.imageUrl} required className="h-8 text-xs glass-input" />
            </div>

            {image.id.startsWith('grid-') && (
              <div className="space-y-1.5">
                <Label htmlFor={`name-${image.id}`} className="text-xs">Title</Label>
                <Input id={`name-${image.id}`} name="name" defaultValue={image.name} className="h-8 text-xs glass-input" />
              </div>
            )}

            {(image.id.startsWith('slider-') || image.id.startsWith('hero-') || image.id.startsWith('promo-banner-')) && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`buttonText-${image.id}`} className="text-xs">Button Text</Label>
                  <Input id={`buttonText-${image.id}`} name="buttonText" defaultValue={image.buttonText} placeholder="Shop Now" className="h-8 text-xs glass-input" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`linkUrl-${image.id}`} className="text-xs">Link URL</Label>
                  <Input id={`linkUrl-${image.id}`} name="linkUrl" defaultValue={image.linkUrl} placeholder="/shop" className="h-8 text-xs glass-input" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor={`imageHint-${image.id}`} className="text-xs">ALT Text / AI Hint</Label>
              <Input id={`imageHint-${image.id}`} name="imageHint" defaultValue={image.imageHint} className="h-8 text-xs glass-input" />
            </div>
          </div>
        </div>

        <div className="p-4 pt-0 mt-auto">
          <Button type="submit" className="w-full h-8 text-xs bg-[#137fec] hover:bg-[#0d6edb] text-white">
            <Save className="mr-2 h-3 w-3" /> Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

export default async function SiteImagesPage() {
  noStore();
  const { placeholderImages: images } = await getSiteImages();
  const allImages = images;

  const sliderImages = allImages.filter((img: any) => img.id.startsWith('slider-') || img.id.startsWith('hero-'));
  const bannerImages = allImages.filter((img: any) => img.id.startsWith('promo-banner-'));
  const homepageGrid = allImages.filter((img: any) => img.id.startsWith('grid-'));
  const spotlightImages = allImages.filter((img: any) => img.id.startsWith('spotlight-'));
  const instagramImages = allImages.filter((img: any) => img.id.startsWith('instagram-'));
  const dualBannerImages = allImages.filter((img: any) => img.id.startsWith('dual-banner-'));
  const otherImages = allImages.filter((img: any) => !img.id.startsWith('slider-') && !img.id.startsWith('promo-banner-') && !img.id.startsWith('grid-') && !img.id.startsWith('hero-') && !img.id.startsWith('spotlight-') && !img.id.startsWith('instagram-') && !img.id.startsWith('dual-banner-'));


  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-[#137fec]" />
            Site Images
          </h1>
          <p className="text-muted-foreground text-sm">Manage visuals across your homepage and site</p>
        </div>
        <div className="item-center w-full sm:w-auto">
          <AddSiteImageDialog />
        </div>
      </div>

      <Alert className="bg-[#137fec]/10 border-[#137fec]/20 text-[#137fec]">
        <Info className="h-4 w-4 stroke-[#137fec]" />
        <AlertTitle>Optimization Tip</AlertTitle>
        <AlertDescription className="text-xs opacity-90">
          For best performance, ensure your images are optimized (WebP format preferred) and properly sized. The "ALT Text" helps SEO and accessibility.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-white/5 pb-2 flex items-center gap-2">
          <span className="w-2 h-8 bg-[#137fec] rounded-full"></span>
          Homepage Slider
        </h2>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {sliderImages.map((image: any) => (
              <CarouselItem key={image.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <ImageCard image={image} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 bg-black/50 border-none text-white hover:bg-black/70" />
          <CarouselNext className="right-0 bg-black/50 border-none text-white hover:bg-black/70" />
        </Carousel>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-white/5 pb-2 flex items-center gap-2">
          <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
          Promo Banners
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bannerImages.map((image: any) => <ImageCard key={image.id} image={image} />)}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-white/5 pb-2 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-500 rounded-full"></span>
          Grid Features
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {homepageGrid.map((image: any) => <ImageCard key={image.id} image={image} />)}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-white/5 pb-2 flex items-center gap-2">
          <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
          Spotlight Slider
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {spotlightImages.map((image: any) => <ImageCard key={image.id} image={image} />)}
          {spotlightImages.length === 0 && <p className="text-xs text-muted-foreground col-span-full">No spotlight images yet. Click &quot;Add New Image&quot; and select &quot;Spotlight Slider&quot;.</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-white/5 pb-2 flex items-center gap-2">
          <span className="w-2 h-8 bg-pink-500 rounded-full"></span>
          Instagram Feed
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {instagramImages.map((image: any) => <ImageCard key={image.id} image={image} />)}
          {instagramImages.length === 0 && <p className="text-xs text-muted-foreground col-span-full">No Instagram images yet. Click &quot;Add New Image&quot; and select &quot;Instagram Feed&quot;.</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-white/5 pb-2 flex items-center gap-2">
          <span className="w-2 h-8 bg-teal-500 rounded-full"></span>
          Landscape Dual Banners
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {dualBannerImages.map((image: any) => <ImageCard key={image.id} image={image} />)}
          {dualBannerImages.length === 0 && <p className="text-xs text-muted-foreground col-span-full">No dual banners yet. Click &quot;Add New Image&quot; and select &quot;Landscape Dual Banners&quot;.</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-white/5 pb-2 flex items-center gap-2">
          <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
          Miscellaneous
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherImages.map((image: any) => <ImageCard key={image.id} image={image} />)}
        </div>
      </div>
    </div>
  );
}
