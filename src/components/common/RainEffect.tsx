'use client';

/**
 * RAIN EFFECT COMPONENT
 * ---------------------
 * HOW TO USE:
 * 1. To turn ON/OFF: 
 *    - Go to HomeClient.tsx and find the <RainEffect /> tag.
 *    - Comment it out {/* <RainEffect /> *\/} to turn OFF.
 *    - Uncomment it to turn ON.
 * 
 * 2. CONFIGURATION:
 *    - You can change 'count' for more/less elements.
 *    - You can change 'colors' to match your brand.
 *    - You can change 'shapes' (heart, star, circle, sparkle).
 * 
 * 3. ADMIN PANEL CONTROL (Upcoming):
 *    - This can be linked to site_settings.banner_effect in the database.
 */

import { useEffect, useState } from 'react';
import { Heart, Star, Circle, Sparkles } from 'lucide-react';

// Configuration for Rain Effect
const RAIN_CONFIG = {
    count: 20,           // Quantity of elements falling at once
    minDuration: 4,      // Fastest speed in seconds
    maxDuration: 10,     // Slowest speed in seconds
    minSize: 10,         // Minimum size in pixels
    maxSize: 25,         // Maximum size in pixels
    colors: [            // Available colors
        'text-pink-200',
        'text-pink-300',
        'text-rose-200',
        'text-red-200',
        'text-yellow-200',
        'text-blue-200',
        'text-purple-200',
        'text-white',    // Added white for snow
    ],
    shapes: ['heart', 'star', 'circle', 'sparkle', 'snow'] // Added snow shape
};

interface RainBubble {
    id: number;
    left: number;
    animationDuration: number;
    size: number;
    delay: number;
    color: string;
    shape: string;
    swayDuration: number; // Duration for horizontal swaying
}

interface RainEffectProps {
    effectType?: 'rain' | 'heart' | 'star' | 'snow' | 'none';
    glow?: boolean;
}

export default function RainEffect({ effectType = 'rain', glow = true }: RainEffectProps) {
    const [elements, setElements] = useState<RainBubble[]>([]);

    useEffect(() => {
        if (effectType === 'none') {
            setElements([]);
            return;
        }

        const generateElements = () => {
            const newElements: RainBubble[] = [];

            let allowedShapes = RAIN_CONFIG.shapes;
            let colors = RAIN_CONFIG.colors;

            if (effectType === 'heart') allowedShapes = ['heart'];
            if (effectType === 'star') allowedShapes = ['star'];
            if (effectType === 'snow') {
                allowedShapes = ['circle'];
                colors = ['text-white', 'text-blue-50', 'text-blue-100'];
            }

            for (let i = 0; i < RAIN_CONFIG.count; i++) {
                newElements.push({
                    id: i,
                    left: Math.random() * 100,
                    animationDuration: (effectType === 'snow' ? 8 : 4) + Math.random() * 6,
                    size: RAIN_CONFIG.minSize + Math.random() * (RAIN_CONFIG.maxSize - RAIN_CONFIG.minSize),
                    delay: Math.random() * 5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    shape: allowedShapes[Math.floor(Math.random() * allowedShapes.length)],
                    swayDuration: 2 + Math.random() * 4
                });
            }
            return newElements;
        };

        setElements(generateElements());
    }, [effectType]);

    if (effectType === 'none') return null;

    const renderShape = (element: RainBubble) => {
        const props = {
            className: `${element.color} fill-current`,
            style: {
                width: `${element.size}px`,
                height: `${element.size}px`,
                opacity: 0.7,
                filter: glow ? 'drop-shadow(0 0 8px currentColor)' : 'none'
            }
        };

        switch (element.shape) {
            case 'heart': return <Heart {...props} />;
            case 'star': return <Star {...props} />;
            case 'circle': return <Circle {...props} />;
            case 'sparkle': return <Sparkles {...props} />;
            default: return <Heart {...props} />;
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <style>{`
                @keyframes floatDown {
                    0% {
                        transform: translateY(-10vh) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.8;
                    }
                    90% {
                        opacity: 0.6;
                    }
                    100% {
                        transform: translateY(110vh) rotate(360deg);
                        opacity: 0;
                    }
                }
                @keyframes sway {
                    0%, 100% {
                        transform: translateX(-15px);
                    }
                    50% {
                        transform: translateX(15px);
                    }
                }
            `}</style>

            {elements.map((el) => (
                <div
                    key={el.id}
                    className="absolute"
                    style={{
                        top: '-50px',
                        left: `${el.left}%`,
                        animation: `floatDown ${el.animationDuration}s linear infinite`,
                        animationDelay: `${el.delay}s`,
                        willChange: 'transform, opacity'
                    }}
                >
                    <div style={{
                        animation: `sway ${el.swayDuration}s ease-in-out infinite`,
                    }}>
                        {renderShape(el)}
                    </div>
                </div>
            ))}
        </div>
    );
}
