'use client';

import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { MapPin } from 'lucide-react';

const PROJECTION_CONFIG = {
    scale: 1000,
    center: [78.9629, 22.5937] // Center of India
};

interface IndiaMapProps {
    data: { state: string; value: number }[];
}

export function IndiaMap({ data }: IndiaMapProps) {
    const colorScale = scaleLinear<string>()
        .domain([0, Math.max(...data.map(d => d.value), 1)])
        .range(['#ffedea', '#ff5233']);

    const geographyStyle = {
        default: { outline: 'none' },
        hover: { outline: 'none', fill: '#ccc' },
        pressed: { outline: 'none' },
    };

    const [topoData, setTopoData] = React.useState<any>(null);
    // Using a reliable source or fallback
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        // Highcharts works well for India: https://code.highcharts.com/mapdata/countries/in/in-all.topo.json
        // Or unpkg: https://unpkg.com/india-atlas/india-states.json (might wait)

        // This URL is often reliable for TopoJSON India
        // const MAP_URL = 'https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json';

        // Let's try the Highcharts one, usually very reliable and stable.
        // Use a reliable TopoJSON source for India
        const MAP_URL = 'https://raw.githubusercontent.com/mayank-k-sharma/topojson-india/master/india_states.json';

        fetch(MAP_URL)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load map data');
                return res.json();
            })
            .then(data => {
                // Determine the key for the objects (admin_1_states_provinces_lakes or similar)
                // If it's TopoJSON, we need to pass the whole object to Geographies, and it iterates.
                // But Geographies needs to know which object to use if multiple? No, it usually iterates the first one or we specify.
                // React-simple-maps Geographies prop accepts the whole topojson object.
                setTopoData(data);
            })
            .catch(err => {
                console.error("Map load error", err);
                setError(true);
            });
    }, []);

    if (error) {
        return (
            <div className="h-[300px] md:h-[400px] w-full bg-muted/20 rounded-lg flex flex-col items-center justify-center text-muted-foreground gap-2 border-2 border-dashed border-muted">
                <MapPin className="h-8 w-8 opacity-20" />
                <p>Map data unavailable</p>
                <p className="text-xs">Could not load geographic data.</p>
            </div>
        );
    }

    if (!topoData) return (
        <div className="h-[300px] md:h-[400px] w-full bg-muted/10 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">
            Loading Map...
        </div>
    );

    return (
        <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center bg-white rounded-lg pt-4 overflow-hidden">

            <ComposableMap
                projection="geoMercator"
                projectionConfig={PROJECTION_CONFIG as any}
                width={800}
                height={600}
                className="w-full h-full"
            >
                <Geographies geography={topoData}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            // Match state name from properties (common keys: name, NAME_1, ST_NM)
                            const geoName = geo.properties.name || geo.properties.NAME_1 || geo.properties.ST_NM || geo.id;
                            const current = data.find((s) =>
                                s.state.toLowerCase() === geoName?.toLowerCase()
                            );
                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={current ? colorScale(current.value) : '#EEE'}
                                    stroke="#DDD"
                                    style={geographyStyle}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
        </div>
    );
}
