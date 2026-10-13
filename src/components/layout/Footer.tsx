'use client';

import { FooterContent } from './FooterContent';
import { useEffect, useState } from 'react';
import type { Category } from '@/lib/types';
import { getCategoriesDirect } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';

const Footer = () => {
  const { settings } = useSettings();
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const c = await getCategoriesDirect();
        setAllCategories(c || []);
      } catch (error) {
        console.error("Failed to fetch footer categories", error);
      }
    };
    fetchData();
  }, []);

  return <FooterContent settings={settings || {}} allCategories={allCategories} />;
};

export default Footer;
