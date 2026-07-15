'use client';

import React from 'react';
import { ThemeProvider, UploadProvider, NotificationProvider } from '@/app/lib/store';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <UploadProvider>
          {children}
        </UploadProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
