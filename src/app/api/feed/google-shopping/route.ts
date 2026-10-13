import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/data-async';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache feed for 1 hour

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    const products = await getProducts();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://milletyard.com';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Millet Yard - 100% Pure &amp; Natural Millets</title>
    <link>${baseUrl}</link>
    <description>Shop premium unpolished millet grains, nutrient-dense flours, rawa, snacks and healthy combos direct from Millet Yard.</description>
`;

    for (const p of products) {
      const handle = p.id;
      const title = escapeXml(p.name);
      const rawDesc = p.shortDescription || p.description || `${p.name} online from Millet Yard.`;
      const cleanDesc = escapeXml(rawDesc.replace(/<[^>]*>/g, '').substring(0, 5000));
      const link = `${baseUrl}/products/${handle}`;
      const imageLink = p.imageUrl ? escapeXml(p.imageUrl) : `${baseUrl}/placeholder-image.svg`;
      const price = `${p.price || 0} INR`;
      const salePrice = p.discountedPrice && p.discountedPrice < (p.price || 0) ? `${p.discountedPrice} INR` : null;
      const availability = (p.stock !== undefined && p.stock <= 0) ? 'out_of_stock' : 'in_stock';
      const category = escapeXml(p.category || 'Food, Beverages & Tobacco > Food Items > Grains, Rice & Cereal');

      xml += `    <item>
      <g:id>${escapeXml(handle)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${cleanDesc}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
${salePrice ? `      <g:sale_price>${salePrice}</g:sale_price>\n` : ''}      <g:brand>Millet Yard</g:brand>
      <g:google_product_category>Food, Beverages &amp; Tobacco &gt; Food Items &gt; Grains, Rice &amp; Cereal</g:google_product_category>
      <g:product_type>${category}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
    </item>
`;
    }

    xml += `  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Failed to generate Google Shopping feed:', error);
    return new NextResponse('Error generating feed', { status: 500 });
  }
}
