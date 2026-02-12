import React from 'react';
import { tabs, mobileMainTabs, TabId } from '@/config/tabs';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  const visibleTabs = tabs.filter(t => mobileMainTabs.includes(t.id));

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 glass-bottom md:hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Safe area spacer for notch devices */}
      <div className="flex items-stretch justify-around px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)]">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                  isActive &&
                    "bg-primary/10"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium leading-none">
                {tab.shortLabel || tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
