import { getSiteImages } from "@/lib/data-supabase";
import { getBlogPostBySlug } from "@/lib/data-async";
import EditBlogClient from "./client";
import { notFound } from "next/navigation";

export default async function EditBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [siteImages, post] = await Promise.all([
    getSiteImages(),
    getBlogPostBySlug(slug)
  ]);

  if (!post) {
    notFound();
  }

  return <EditBlogClient post={post} slug={slug} siteImages={siteImages.placeholderImages} />;
}
