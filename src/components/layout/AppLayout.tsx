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
      background: 'linear-gradient(135deg, #e8f0fe 0%, #dce8f8 20%, #f0e6f6 40%, #e2ecf5 60%, #d6e5f0 80%, #eef2f7 100%)'
    }}>
      {/* iOS ambient blobs - give depth for glass blur */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute left-[-15%] top-[-10%] h-[700px] w-[700px] rounded-full opacity-70" style={{
          background: 'radial-gradient(circle, rgba(120,180,255,0.35) 0%, rgba(120,180,255,0) 70%)',
        }} />
        <div className="absolute right-[-10%] top-[15%] h-[600px] w-[600px] rounded-full opacity-60" style={{
          background: 'radial-gradient(circle, rgba(180,140,255,0.3) 0%, rgba(180,140,255,0) 70%)',
        }} />
        <div className="absolute left-[30%] top-[50%] h-[500px] w-[500px] rounded-full opacity-50" style={{
          background: 'radial-gradient(circle, rgba(100,200,220,0.3) 0%, rgba(100,200,220,0) 70%)',
        }} />
        <div className="absolute right-[20%] bottom-[-10%] h-[600px] w-[600px] rounded-full opacity-50" style={{
          background: 'radial-gradient(circle, rgba(255,180,120,0.2) 0%, rgba(255,180,120,0) 70%)',
        }} />
        <div className="absolute left-[-5%] bottom-[10%] h-[400px] w-[400px] rounded-full opacity-40" style={{
          background: 'radial-gradient(circle, rgba(140,220,180,0.25) 0%, rgba(140,220,180,0) 70%)',
        }} />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header currentTab={currentTab} onTabChange={onTabChange} />
        
        <div className="flex flex-1">
          <SidebarNav currentTab={currentTab} onTabChange={onTabChange} />
          
          <main className={cn(
            "flex-1 overflow-auto pb-20 md:pb-0",
            "scrollbar-thin"
          )}>
            <div className="w-full p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
        
        <BottomNav currentTab={currentTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
}
