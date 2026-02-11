import React from 'react';
import { Header } from './Header';
import { SidebarNav } from './SidebarNav';
import { BottomNav } from './BottomNav';
import { TabId } from '@/config/tabs';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function AppLayout({ children, currentTab, onTabChange }: AppLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#030303] overflow-hidden">
      {/* Ambient background orbs - Ultra dark theme with violet/teal/fuchsia */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        <div className="absolute left-[-30%] top-[0%] h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[150px]" />
        <div className="absolute right-[-20%] top-[15%] h-[400px] w-[400px] rounded-full bg-teal-500/12 blur-[130px]" />
        <div className="absolute left-[10%] bottom-[5%] h-[450px] w-[450px] rounded-full bg-fuchsia-600/12 blur-[160px]" />
        <div className="absolute right-[-10%] bottom-[30%] h-[350px] w-[350px] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      {/* Main content wrapper with z-index to stay above orbs */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header currentTab={currentTab} onTabChange={onTabChange} />
        
        <div className="flex flex-1">
          <SidebarNav currentTab={currentTab} onTabChange={onTabChange} />
          
          <main className={cn(
            "flex-1 overflow-auto pb-20 md:pb-0",
            "scrollbar-thin"
          )}>
            <div className="container mx-auto p-4 md:p-6 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
        
        <BottomNav currentTab={currentTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
}
