'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/stores/app-store';

export function DynamicStyles() {
  const { ui: { fontSize, sidebarWidth } } = useAppStore();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Apply font size class to document body
    document.body.className = document.body.className
      .replace(/font-size-(small|medium|large)/g, '')
      .trim();
    document.body.classList.add(`font-size-${fontSize}`);

    // Apply sidebar width class to document body
    document.body.className = document.body.className
      .replace(/sidebar-(narrow|normal|wide)/g, '')
      .trim();
    document.body.classList.add(`sidebar-${sidebarWidth}`);

    console.log('🎨 Applied dynamic styles:', { fontSize, sidebarWidth });
  }, [fontSize, sidebarWidth]);

  return null; // This component only applies styles
}