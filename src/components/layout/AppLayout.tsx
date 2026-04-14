import React from 'react';
import { Header } from './Header';
import { SidebarNav } from './SidebarNav';
import { BottomNav } from './BottomNav';
import { TabId } from '@/config/tabs';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
  onAddVehicle?: () => void;
}

export function AppLayout({ children, currentTab, onTabChange, onAddVehicle }: AppLayoutProps) {
  return (
    <div className="relative flex min-h-screen">
      <SidebarNav currentTab={currentTab} onTabChange={onTabChange} />
      
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header currentTab={currentTab} onTabChange={onTabChange} />
        
        <main className={cn(
          "flex-1 overflow-y-auto pb-24 md:pb-8",
          "scrollbar-thin"
        )}>
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
        
        {/* Floating Action Button (Mobile) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] md:hidden">
          <Button
            onClick={onAddVehicle}
            size="icon"
            className="h-16 w-16 rounded-full gold-button shadow-2xl shadow-primary/40 hover:scale-105 transition-all active:scale-90 border-4 border-black/20 backdrop-blur-md"
          >
            <Plus className="h-8 w-8 text-black" />
            <span className="sr-only">Aggiungi veicolo</span>
          </Button>
        </div>

        <BottomNav currentTab={currentTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
}
