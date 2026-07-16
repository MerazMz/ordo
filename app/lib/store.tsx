'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UploadedFile, PrintOptions, Notification } from './types';
import { generateId } from './utils';

// ============================================
// Theme Context
// ============================================

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = localStorage.getItem('ordo-theme') as Theme | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle('dark', stored === 'dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('ordo-theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// ============================================
// Upload / Cart Context
// ============================================

const defaultPrintOptions: PrintOptions = {
  color: 'bw',
  side: 'single',
  copies: 1,
  copiesBW: 1,
  copiesColor: 0,
  pageRange: 'all',
  paperSize: 'A4',
  orientation: 'portrait',
  staple: false,
  spiralBinding: false,
  lamination: false,
  bondPaper: false,
};

interface UploadContextType {
  files: UploadedFile[];
  addFile: (file: Omit<UploadedFile, 'id' | 'printOptions' | 'price'> & { pages: number }) => void;
  removeFile: (id: string) => void;
  updateFileOptions: (id: string, options: Partial<PrintOptions>) => void;
  clearFiles: () => void;
  selectedShopId: string | null;
  setSelectedShopId: (id: string | null) => void;
  notes: string;
  setNotes: (notes: string) => void;
}

const UploadContext = createContext<UploadContextType>({
  files: [],
  addFile: () => {},
  removeFile: () => {},
  updateFileOptions: () => {},
  clearFiles: () => {},
  selectedShopId: null,
  setSelectedShopId: () => {},
  notes: '',
  setNotes: () => {},
});

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const addFile = useCallback(
    (file: Omit<UploadedFile, 'id' | 'printOptions' | 'price'> & { pages: number }) => {
      const newFile: UploadedFile = {
        ...file,
        id: generateId(),
        printOptions: { ...defaultPrintOptions },
        price: 0,
      };
      setFiles((prev) => [...prev, newFile]);
    },
    []
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateFileOptions = useCallback(
    (id: string, options: Partial<PrintOptions>) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, printOptions: { ...f.printOptions, ...options } }
            : f
        )
      );
    },
    []
  );

  const clearFiles = useCallback(() => {
    setFiles([]);
    setNotes('');
  }, []);

  return (
    <UploadContext.Provider
      value={{
        files,
        addFile,
        removeFile,
        updateFileOptions,
        clearFiles,
        selectedShopId,
        setSelectedShopId,
        notes,
        setNotes,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  return useContext(UploadContext);
}

// ============================================
// Notification Context
// ============================================

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  clearNotifications: () => {},
  unreadCount: 0,
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ordo-notifications');
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse notifications:', e);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Sync to localStorage when notifications change
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('ordo-notifications', JSON.stringify(notifications));
    }
  }, [notifications, isLoaded]);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
      const newNotification: Notification = {
        ...notification,
        id: generateId(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        clearNotifications,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
