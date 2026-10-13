'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSiteSettings } from './data-async';
import type { SiteSettings } from './types';

interface SettingsContextType {
    settings: SiteSettings;
    loading: boolean;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children, initialSettings }: { children: React.ReactNode, initialSettings?: SiteSettings }) {
    const [settings, setSettings] = useState<SiteSettings>(initialSettings || {});
    const [loading, setLoading] = useState(!initialSettings);

    const refreshSettings = async () => {
        try {
            const data = await getSiteSettings();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching site settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!initialSettings) {
            refreshSettings();
        }
    }, [initialSettings]);

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
