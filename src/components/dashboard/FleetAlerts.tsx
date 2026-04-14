import React from 'react';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, Bell } from "lucide-react";
import { formatDate } from '@/lib/utils/dates';
import { Badge } from '@/components/ui/badge';

export function FleetAlerts() {
  const { data, getLegalDeadlines } = useVehicleContext();

  // Scansiona tutti i veicoli per trovare scadenze urgenti
  const alerts = data.vehicles.map(v => ({
    vehicle: v,
    deadlines: getLegalDeadlines(v.id)
  })).filter(item => item.deadlines?.isUrgent);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-4 mb-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 px-1">
        <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-destructive/80">
          Avvisi Critici Flotta
        </h2>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {alerts.map(({ vehicle, deadlines }) => (
          <div 
            key={vehicle.id} 
            className="relative overflow-hidden bg-destructive/5 border-l-4 border-destructive p-5 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="p-2 bg-destructive/10 rounded-xl">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <Badge variant="destructive" className="rounded-full font-mono text-[10px] px-2 py-0">
                {vehicle.plate}
              </Badge>
            </div>
            
            <div className="mt-4">
              <h3 className="font-extrabold text-neutral-900 dark:text-neutral-100">Scadenza Imminente</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                La revisione per <span className="text-neutral-900 dark:text-neutral-100 font-bold">{vehicle.brand} {vehicle.model}</span> scade il:
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-destructive text-white rounded-xl text-sm font-bold shadow-md shadow-destructive/20">
                <Calendar className="h-4 w-4" />
                {deadlines?.nextInspection ? formatDate(deadlines.nextInspection) : '-'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
