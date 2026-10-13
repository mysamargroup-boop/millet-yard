

'use client';
import Link from 'next/link';
import { Heart } from 'lucide-react';

const iconCategories = [
  {
    name: "Under ₹149",
    icon: <div className="text-xs md:text-sm font-bold text-center text-white">Under<br />₹149</div>,
    href: "/shop?maxPrice=149",
    color: 'bg-emerald-700'
  },
  {
    name: "Under ₹199",
    icon: <div className="text-xs md:text-sm font-bold text-center text-white">Under<br />₹199</div>,
    href: "/shop?maxPrice=199",
    color: 'bg-emerald-800'
  },
  {
    name: "Under ₹299",
    icon: <div className="text-xs md:text-sm font-bold text-center text-white">Under<br />₹299</div>,
    href: "/shop?maxPrice=299",
    color: 'bg-emerald-900'
  },
  {
    name: "Under ₹499",
    icon: <div className="text-xs md:text-sm font-bold text-center text-white">Under<br />₹499</div>,
    href: "/shop?maxPrice=499",
    color: 'bg-amber-600'
  },
  {
    name: "Combos",
    icon: <div className="text-xs md:text-sm font-bold text-center text-white">Value<br />Combos</div>,
    href: "/collections/superfood-combos",
    color: 'bg-amber-700'
  },
  {
    name: "Pure Atta",
    icon: <div className="text-xs md:text-sm font-bold text-center text-white">Stone<br />Atta</div>,
    href: "/collections/wholesome-atta",
    color: 'bg-teal-700'
  },
  {
    name: "Raw Millets",
    icon: <div className="text-xs md:text-sm font-bold text-center text-white">Whole<br />Grains</div>,
    href: "/collections/unpolished-millets",
    color: 'bg-teal-800'
  },
];

export default function IconCategoryGrid() {
  return (
    <section className="py-8 md:py-12 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 md:gap-8 justify-items-center">
          {iconCategories.map((item, index) => (
            <Link key={index} href={item.href} className="group flex flex-col items-center text-center gap-2 md:gap-3">
              <div className={`flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-full ${item.color} group-hover:bg-accent transition-colors shadow-sm`}>
                {item.icon}
              </div>
              <p className="text-[10px] md:text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                {item.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
