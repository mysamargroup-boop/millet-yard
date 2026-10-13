"use client";

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SubCategory {
  name: string;
  image?: string;
}

interface SubCategorySliderProps {
  subcategories: SubCategory[];
  selectedSubCategory: string | null;
  onSelect: (subCategory: string | null) => void;
}

export default function SubCategorySlider({ 
  subcategories, 
  selectedSubCategory, 
  onSelect 
}: SubCategorySliderProps) {
  
  if (!subcategories || subcategories.length === 0) return null;

  return (
    <div className="w-full mb-8">
      <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
        {/* All Products Button */}
        <button
          onClick={() => onSelect(null)}
          className="group flex flex-col items-center gap-3"
        >
          <div className={cn(
            "relative w-24 h-24 rounded-full p-[3px] transition-all duration-300",
            selectedSubCategory === null
              ? "bg-gradient-to-br from-primary to-accent shadow-md"
              : "bg-transparent border-2 border-muted-foreground/20 group-hover:border-primary/50"
          )}>
            <div className="relative w-full h-full rounded-full overflow-hidden bg-background flex items-center justify-center">
               <div className={cn(
                 "absolute inset-0 opacity-10",
                 selectedSubCategory === null ? "bg-gradient-to-br from-primary to-accent" : "bg-muted"
               )} />
               <span className={cn(
                 "text-lg font-bold uppercase tracking-widest z-10",
                 selectedSubCategory === null 
                   ? "bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent" 
                   : "text-muted-foreground"
               )}>All</span>
            </div>
          </div>
          <span className={cn(
            "text-sm font-medium transition-colors",
            selectedSubCategory === null 
              ? "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold" 
              : "text-muted-foreground group-hover:text-foreground"
          )}>
            All Products
          </span>
        </button>
        
        {/* Subcategories */}
        {subcategories.map((sub) => {
          const isSelected = selectedSubCategory === sub.name;
          return (
            <button
              key={sub.name}
              onClick={() => onSelect(sub.name)}
              className="group flex flex-col items-center gap-3"
            >
              <div className={cn(
                "relative w-24 h-24 rounded-full p-[3px] transition-all duration-300",
                isSelected
                  ? "bg-gradient-to-br from-primary to-accent shadow-md"
                  : "bg-transparent border-2 border-muted-foreground/20 group-hover:border-primary/50"
              )}>
                <div className="relative w-full h-full rounded-full overflow-hidden bg-background">
                  {sub.image ? (
                    <Image 
                      src={sub.image} 
                      alt={sub.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-muted-foreground/50">{sub.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
              </div>
              <span className={cn(
                "text-sm font-medium transition-colors max-w-[100px] truncate text-center",
                isSelected 
                  ? "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold" 
                  : "text-muted-foreground group-hover:text-foreground"
              )}>
                {sub.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
