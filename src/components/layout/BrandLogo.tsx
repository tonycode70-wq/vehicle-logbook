import React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function BrandLogo({ className, iconOnly = false }: BrandLogoProps) {
  return (
    <a 
      href="/" 
      className={cn(
        "flex flex-col items-center gap-1 group transition-all duration-500",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        // Se c'è un gestore di navigazione personalizzato, usalo, altrimenti usa il link standard
        const navEvent = new CustomEvent('navigation', { detail: 'dashboard' });
        window.dispatchEvent(navEvent);
      }}
    >
      <div className="flex flex-col items-center transition-all duration-300 group-hover:brightness-125">
        {/* Silhouette dell'Auto (SVG) */}
        <svg 
          viewBox="0 0 100 30" 
          className={cn(
            "w-full h-auto drop-shadow-[0_2px_4px_rgba(212,175,55,0.3)]",
            iconOnly ? "max-w-[50px]" : "max-w-[140px]"
          )}
        >
          <defs>
            <linearGradient id="gold-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="50%" stopColor="#FBE795" />
              <stop offset="100%" stopColor="#C5A028" />
            </linearGradient>
          </defs>
          {/* Silhouette minimale coupé sportiva - singola linea curva fluida */}
          <path 
            d="M10,24 C25,24 35,10 55,10 C75,10 85,18 90,24" 
            fill="none" 
            stroke="url(#gold-metallic)" 
            strokeWidth="1.2" 
            strokeLinecap="round"
          />
        </svg>

        {/* Tipografia Elegante */}
        {!iconOnly && (
          <span className="playfair-display text-[11px] font-semibold uppercase tracking-[0.5em] mt-1 text-transparent bg-clip-text bg-[linear-gradient(135deg,#D4AF37_0%,#FBE795_50%,#C5A028_100%)] whitespace-nowrap drop-shadow-[0_1px_2px_rgba(212,175,55,0.2)]">
            BARONS VEICOLI
          </span>
        )}
      </div>
    </a>
  );
}
