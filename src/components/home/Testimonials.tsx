'use client';

import { Testimonial } from '@/lib/types';
import { Star, Quote, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import GradientHeading from '@/components/ui/GradientHeading';
import { useRef } from 'react';

interface TestimonialsProps {
    testimonials: Testimonial[];
}

const PLACEHOLDER_TESTIMONIALS: Testimonial[] = [
    {
        id: 't1',
        customer_name: 'Dr. Sunita Sharma',
        content: 'Switched to Millet Yard unpolished Browntop and Foxtail millets 3 months ago. Remarkable improvement in fasting blood sugar levels. 100% natural and clean grains!',
        rating: 5,
        created_at: new Date().toISOString(),
        is_visible: true,
        avatar_url: 'https://i.pravatar.cc/150?u=sunita'
    },
    {
        id: 't2',
        customer_name: 'Rajesh Mehra',
        content: 'The cold stone-ground Barnyard and Ragi flour make super soft rotis without any gum or additives. You can immediately smell the farm-fresh purity.',
        rating: 5,
        created_at: new Date().toISOString(),
        is_visible: true,
        avatar_url: 'https://i.pravatar.cc/150?u=rajesh'
    },
    {
        id: 't3',
        customer_name: 'Pooja Deshmukh',
        content: 'Their roasted Chana Sattu and handmade Aam Ka Achaar remind me of my village roots. Clean packaging and prompt courier delivery to Pune.',
        rating: 5,
        created_at: new Date().toISOString(),
        is_visible: true,
        avatar_url: 'https://i.pravatar.cc/150?u=pooja'
    }
];

export default function Testimonials({ testimonials }: TestimonialsProps) {
    const displayTestimonials = testimonials.length > 0 ? testimonials : PLACEHOLDER_TESTIMONIALS;
    const autoplayPlugin = useRef(
        Autoplay({ delay: 5000, stopOnInteraction: false, playOnInit: true })
    );

    return (
        <section className="py-8 md:py-12 relative overflow-hidden bg-transparent">
            {/* Subtle Wavy Background SVG Top removed - using transparent */}

            {/* Subtle Background Decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/3 rounded-full blur-3xl -z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/3 rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <GradientHeading
                    text="What Our Customers Say"
                    icon="MessageSquare"
                    subtitle="Real experiences from our valued customers who love our handcrafted work."
                    variant="left"
                    size="lg"
                />

                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    plugins={[autoplayPlugin.current]}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {displayTestimonials.map((testimonial) => (
                            <CarouselItem key={testimonial.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                                <Card className="h-full border-none shadow-lg hover:shadow-xl transition-shadow bg-white dark:bg-slate-800/50 backdrop-blur-sm">
                                    <CardContent className="p-8 flex flex-col h-full">
                                        <div className="mb-6 flex justify-between items-start">
                                            <div className="flex gap-1 text-yellow-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-5 w-5 ${i < testimonial.rating ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`}
                                                    />
                                                ))}
                                            </div>
                                            <Quote className="h-8 w-8 text-primary/10" />
                                        </div>

                                        <p className="text-slate-600 dark:text-slate-300 italic mb-8 flex-1 leading-relaxed">
                                            "{testimonial.content}"
                                        </p>

                                        <div className="flex items-center gap-4 mt-auto border-t border-slate-100 dark:border-slate-800 pt-6">
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                                    {testimonial.customer_name}
                                                </h4>
                                                <p className="text-xs text-muted-foreground ml-4">Verified Customer</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="flex justify-center gap-4 mt-8">
                        <CarouselPrevious className="static translate-y-0" />
                        <CarouselNext className="static translate-y-0" />
                    </div>
                </Carousel>
            </div>
        </section>
    );
}
