'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
  className?: string;
}

const Logo = ({ className }: LogoProps) => {
  return (
    <div className={cn('flex items-center gap-2 select-none', className)}>
      <div className="relative h-9 md:h-11 w-32 md:w-44 flex items-center">
        <Image
          src="/logo.png"
          alt="Millet Yard - 100% Natural Millets"
          width={180}
          height={48}
          priority
          className="object-contain max-h-full w-auto"
          onError={(e: any) => {
            // fallback to text if image fails
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};

export default Logo;
