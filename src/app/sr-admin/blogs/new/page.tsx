import { getSiteImages } from "@/lib/data-supabase";
import NewBlogClient from "./client";

export default async function NewBlogPage() {
  let siteImagesData: { placeholderImages: any[] } = { placeholderImages: [] };
  try {
    const data = await getSiteImages();
    if (data) {
      siteImagesData = data;
    }
  } catch (error) {
    console.error("Failed to fetch site images:", error);
  }
  return <NewBlogClient siteImages={siteImagesData.placeholderImages} />;
}
