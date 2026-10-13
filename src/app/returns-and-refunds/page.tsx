import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, Clock, Truck, RefreshCcw, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const metadata = {
    title: 'Returns & Refunds | Millet Yard',
    description: 'Returns and refunds policy for Millet Yard',
};

export default function ReturnsRefundsPage() {
    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-headline font-bold mb-3">Returns & Refunds Policy</h1>
                <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl mx-auto">
                    We want you to love what you ordered. If something isn't right with your Shree Anna millets or food products, let us know.
                    Here is our clear, customer-first policy.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 mb-12">
                <Card className="text-center p-6 border-none shadow-md bg-white/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold mb-2">7 Days Return</h3>
                        <p className="text-sm text-muted-foreground">Raise a return request within 7 days of delivery for damaged or defective seals.</p>
                    </CardContent>
                </Card>
                <Card className="text-center p-6 border-none shadow-md bg-white/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <RefreshCcw className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold mb-2">Easy Refunds</h3>
                        <p className="text-sm text-muted-foreground">Refunds processed directly to your original payment method or UPI.</p>
                    </CardContent>
                </Card>
                <Card className="text-center p-6 border-none shadow-md bg-white/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Truck className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold mb-2">Doorstep Resolution</h3>
                        <p className="text-sm text-muted-foreground">We arrange replacement or reverse pickup for any damaged packages.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-primary" />
                        Policy Overview
                    </h2>
                    <Card>
                        <CardContent className="p-6">
                            <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    At Millet Yard, we take utmost pride in the freshness and purity of our 100% unpolished millets, grains, and flours. However, if you receive a package that is damaged in transit, defective, or incorrect, we are here to make it right immediately.
                                </p>
                                <p className="mt-4">
                                    Since our products are food-grade grocery items, opened packets cannot be accepted for return due to hygiene and food safety guidelines, unless there is an authentic transit packaging defect reported within 48 hours of delivery.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>What items are eligible for return / replacement?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                Items are eligible for replacement or return if the outer pouch seal arrived damaged, packet torn during transit, or if you received an incorrect grain/flour variety.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>How do I raise a return request?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                You can raise a request by emailing us at support@milletyard.com or via WhatsApp with a photo of the damaged pouch within 48 hours of delivery.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Do I have to pay for return shipping?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                No, if the issue was due to shipping damage or dispatch error, we provide an immediate free replacement or refund.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>When will I get my refund?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                Once verified, refunds are processed within 24-48 business hours and reflect back in your source payment account within 3-5 business days.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </section>

                <section className="bg-muted/30 p-8 rounded-xl text-center border mt-12">
                    <h3 className="text-xl font-bold mb-4">Still have questions?</h3>
                    <p className="text-muted-foreground mb-6">Our customer support team is just an email away.</p>
                    <a href="mailto:support@milletyard.com" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-11 px-8 rounded-md font-medium hover:bg-primary/90 transition-colors">
                        <Mail className="w-4 h-4" /> Contact Support
                    </a>
                </section>
            </div>
        </div>
    );
}
