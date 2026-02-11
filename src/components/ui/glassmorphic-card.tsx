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
    default: "bg-card/40 border-white/10",
    primary: "bg-gradient-to-br from-violet-500/60 via-purple-500/40 to-fuchsia-500/30 border-white/20 shadow-[0_0_50px_rgba(139,92,246,0.35),0_0_100px_rgba(168,85,247,0.12),inset_0_1px_0_0_rgba(255,255,255,0.15)]",
    accent: "bg-gradient-to-br from-teal-500/50 via-cyan-500/30 to-emerald-500/20 border-white/20 shadow-[0_0_40px_rgba(20,184,166,0.25),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
    success: "bg-gradient-to-br from-emerald-500/50 via-green-500/30 to-teal-500/20 border-white/20 shadow-[0_0_40px_rgba(16,185,129,0.25),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
    warning: "bg-gradient-to-br from-amber-500/50 via-orange-500/30 to-yellow-500/20 border-white/20 shadow-[0_0_40px_rgba(245,158,11,0.25),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
  };
  
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl backdrop-blur-xl border p-6 transition-all duration-300",
        variantStyles[variant],
        hover && "hover:shadow-[0_0_60px_rgba(139,92,246,0.45)] hover:border-white/30 hover:-translate-y-1",
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
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            {icon}
          </div>
          <span className="text-sm font-medium text-white/80">
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
      "font-bold tracking-tight text-white",
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
    <p className={cn("text-base text-white/60 mt-1", className)}>
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
    success: "bg-emerald-300/10 text-emerald-300",
    warning: "bg-amber-300/10 text-amber-300",
    info: "bg-white/10 text-white/60",
  };
  
  const iconColor = {
    success: "text-emerald-300",
    warning: "text-amber-300",
    info: "text-white/60",
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
