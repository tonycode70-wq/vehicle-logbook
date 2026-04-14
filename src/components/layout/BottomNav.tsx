import React from 'react';
import { tabs, mobileMainTabs, TabId } from '@/config/tabs';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  const visibleTabs = tabs.filter(t => mobileMainTabs.includes(t.id));
  const firstTwoTabs = visibleTabs.slice(0, 2);
  const lastTwoTabs = visibleTabs.slice(2, 4);

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-900/80 backdrop-blur-xl border-t border-border/50 md:hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between px-4 pt-2 pb-[env(safe-area-inset-bottom,12px)] h-20">
        {/* First two tabs */}
        <div className="flex flex-1 justify-around">
          {firstTwoTabs.map(tab => (
            <NavButton key={tab.id} tab={tab} isActive={currentTab === tab.id} onClick={() => onTabChange(tab.id)} />
          ))}
        </div>

        {/* Central Spacer for FAB */}
        <div className="w-16" />

        {/* Last two tabs */}
        <div className="flex flex-1 justify-around">
          {lastTwoTabs.map(tab => (
            <NavButton key={tab.id} tab={tab} isActive={currentTab === tab.id} onClick={() => onTabChange(tab.id)} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavButton({ tab, isActive, onClick }: { tab: any, isActive: boolean, onClick: () => void }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 transition-all duration-300",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
        isActive && "bg-primary/10"
      )}>
        <Icon className={cn("h-6 w-6", isActive && "scale-110")} />
      </div>
      <span className="text-[10px] font-bold">{tab.shortLabel || tab.label}</span>
    </button>
  );
}
