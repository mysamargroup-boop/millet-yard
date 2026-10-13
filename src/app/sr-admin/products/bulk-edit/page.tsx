
import { getProducts } from "@/lib/data-async";
import { getAdminCategoriesAction } from "@/lib/actions";
import { BulkEditTable } from "@/components/admin/BulkEditTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BulkEditPage() {
    const [products, categories] = await Promise.all([
        getProducts(),
        getAdminCategoriesAction(),
    ]);

    return (
        <div>
            <div className="mb-6">
                <Button variant="ghost" className="mb-2" asChild>
                    <Link href="/sr-admin/products"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Products</Link>
                </Button>
                <h1 className="text-3xl font-headline font-bold">Bulk Edit Products</h1>
                <p className="text-muted-foreground">Quickly update name, category, prices, inventory, badge, and status for all products at once.</p>
            </div>

            <BulkEditTable products={products} categories={categories || []} />
        </div>
    );
}
