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
    <div className="relative flex min-h-screen flex-col overflow-hidden" style={{
      background: 'linear-gradient(165deg, #f8fafc 0%, #eef4fb 35%, #f0f4f8 65%, #f5f7fa 100%)'
    }}>
      {/* iOS ambient blobs - very subtle */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute left-[-10%] top-[-5%] h-[600px] w-[600px] rounded-full bg-blue-200/20 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[500px] w-[500px] rounded-full bg-indigo-100/25 blur-[100px]" />
        <div className="absolute left-[20%] bottom-[0%] h-[500px] w-[500px] rounded-full bg-sky-100/20 blur-[130px]" />
      </div>

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
