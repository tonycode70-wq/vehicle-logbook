import React from 'react';
import { cn } from '@/lib/utils';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
  hover?: boolean;
}

/**
 * Card glassmorphic con effetti del nuovo design ultra-dark
 * Supporta diverse varianti di colore e effetti hover
 */
export function GlassmorphicCard({ 
  children, 
  className, 
  variant = 'default',
  hover = false 
}: GlassmorphicCardProps) {
  
  const variantStyles = {
    default: "glass-card",
    primary: "glass-card bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border-blue-200/30",
    accent: "glass-card bg-gradient-to-br from-sky-50/80 to-cyan-50/60 border-sky-200/30",
    success: "glass-card bg-gradient-to-br from-emerald-50/80 to-green-50/60 border-emerald-200/30",
    warning: "glass-card bg-gradient-to-br from-amber-50/80 to-orange-50/60 border-amber-200/30",
  };
  
  return (
    <div
      className={cn(
        "relative overflow-hidden p-6 transition-all duration-300",
        variantStyles[variant],
        hover && "hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}

interface GlassmorphicCardHeaderProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Header per GlassmorphicCard con icona opzionale
 */
export function GlassmorphicCardHeader({ children, icon, className }: GlassmorphicCardHeaderProps) {
  return (
    <div className={cn("mb-5", className)}>
      {icon && (
        <div className="flex items-center gap-2 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            {icon}
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {typeof children === 'string' ? children : null}
          </span>
        </div>
      )}
      {typeof children !== 'string' && children}
    </div>
  );
}

interface GlassmorphicCardTitleProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Titolo per GlassmorphicCard con diverse dimensioni
 */
export function GlassmorphicCardTitle({ children, className, size = 'lg' }: GlassmorphicCardTitleProps) {
  const sizeStyles = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-5xl",
    xl: "text-6xl",
  };
  
  return (
    <p className={cn(
      "font-bold tracking-tight text-foreground",
      sizeStyles[size],
      className
    )}>
      {children}
    </p>
  );
}

interface GlassmorphicCardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Descrizione per GlassmorphicCard
 */
export function GlassmorphicCardDescription({ children, className }: GlassmorphicCardDescriptionProps) {
  return (
    <p className={cn("text-base text-muted-foreground mt-1", className)}>
      {children}
    </p>
  );
}

interface GlassmorphicBadgeProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'success' | 'warning' | 'info';
  className?: string;
}

/**
 * Badge glassmorphic per indicatori e metriche
 */
export function GlassmorphicBadge({ children, icon, variant = 'info', className }: GlassmorphicBadgeProps) {
  const variantStyles = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    info: "bg-gray-100 text-muted-foreground",
  };
  
  const iconColor = {
    success: "text-emerald-600",
    warning: "text-amber-600",
    info: "text-muted-foreground",
  };
  
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-xl backdrop-blur-sm px-3 py-2 w-fit",
      variantStyles[variant],
      className
    )}>
      {icon && <div className={iconColor[variant]}>{icon}</div>}
      <span className="text-sm font-semibold">
        {children}
      </span>
    </div>
  );
}
