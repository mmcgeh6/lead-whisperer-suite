
import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useTheme } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import DebugConsole from './dev/DebugConsole';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
      <Toaster />
      <SonnerToaster />
      <DebugConsole />
    </div>
  );
};
