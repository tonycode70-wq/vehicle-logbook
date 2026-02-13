import React from 'react';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, Bell } from "lucide-react";
import { formatDate } from '@/lib/utils/dates';

export function FleetAlerts() {
  const { data, getLegalDeadlines } = useVehicleContext();

  // Scansiona tutti i veicoli per trovare scadenze urgenti
  const alerts = data.vehicles.map(v => ({
    vehicle: v,
    deadlines: getLegalDeadlines(v.id)
  })).filter(item => item.deadlines?.isUrgent);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2 px-1 text-muted-foreground mb-2">
        <Bell className="h-4 w-4" />
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Avvisi Flotta
        </h2>
      </div>
      
      {alerts.map(({ vehicle, deadlines }) => (
        <Alert key={vehicle.id} variant="destructive" className="animate-in fade-in slide-in-from-top-4 duration-500">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold flex justify-between">
            <span>Scadenza Imminente</span>
            <span className="text-[10px] bg-destructive/10 px-2 py-0.5 rounded text-destructive-foreground uppercase">
              {vehicle.plate}
            </span>
          </AlertTitle>
          <AlertDescription className="mt-2 text-sm">
            La revisione per <strong>{vehicle.brand} {vehicle.model}</strong> scade il: 
            <span className="ml-2 font-mono font-bold underline">
              {deadlines?.nextInspection ? formatDate(deadlines.nextInspection) : '-'}
            </span>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
