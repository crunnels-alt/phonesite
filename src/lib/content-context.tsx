'use client';

import { createContext, useContext, useRef, useCallback, ReactNode } from 'react';

interface VisibleContent {
  contentType: string;
  contentIds: string[];
}

interface ContentContextType {
  registerContent: (section: string, contentType: string, contentIds: string[]) => void;
  getVisibleContent: (section: string) => VisibleContent | null;
}

const ContentContext = createContext<ContentContextType | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const contentMapRef = useRef<Map<string, VisibleContent>>(new Map());

  const registerContent = useCallback((section: string, contentType: string, contentIds: string[]) => {
    contentMapRef.current.set(section, { contentType, contentIds });
  }, []);

  const getVisibleContent = useCallback((section: string): VisibleContent | null => {
    return contentMapRef.current.get(section) || null;
  }, []);

  return (
    <ContentContext.Provider value={{ registerContent, getVisibleContent }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContentRegistry() {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContentRegistry must be used within a ContentProvider');
  }
  return context;
}
