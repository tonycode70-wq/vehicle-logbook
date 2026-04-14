import React, { useState, useMemo } from 'react';
import { Plus, Car, Bike, Search, Edit, Trash2, Eye, Gauge, Fuel, Calendar, Shield, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Vehicle } from '@/types/vehicle';
import { formatKm, getDaysUntilExpiry } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

interface VehicleListProps {
  onSelectVehicle?: (id: string) => void;
  onEditVehicle?: (vehicle: Vehicle) => void;
  onAddVehicle?: () => void;
}

export function VehicleList({ onSelectVehicle, onEditVehicle, onAddVehicle }: VehicleListProps) {
  const { data, deleteVehicle } = useVehicleContext();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'auto' | 'moto'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<Vehicle | null>(null);

  // Filtra veicoli
  const filteredVehicles = data.vehicles.filter(v => {
    const matchSearch = 
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.plate.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || v.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteVehicle(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white gold-text-gradient uppercase">I tuoi veicoli</h1>
          <p className="text-muted-foreground font-medium">Gestisci e monitora la flotta di famiglia</p>
        </div>
        <Button 
          onClick={onAddVehicle}
          className="gold-gradient text-black hover:opacity-90 rounded-xl px-6 font-bold shadow-[0_0_20px_rgba(212,175,55,0.3)] h-12 border-0"
        >
          <Plus className="mr-2 h-5 w-5" />
          Aggiungi Veicolo
        </Button>
      </div>

      {/* Filtri e Ricerca */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Cerca marca, modello o targa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 luxury-card border-0 shadow-2xl rounded-2xl font-medium focus-visible:ring-primary/20 placeholder:text-muted-foreground/40"
          />
        </div>
        <div className="flex p-1.5 luxury-card rounded-2xl shadow-2xl w-fit border-white/5">
          <button
            onClick={() => setTypeFilter('all')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
              typeFilter === 'all' ? "gold-gradient text-black shadow-lg" : "text-muted-foreground hover:bg-white/5 hover:text-primary"
            )}
          >
            Tutti
          </button>
          <button
            onClick={() => setTypeFilter('auto')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300",
              typeFilter === 'auto' ? "gold-gradient text-black shadow-lg" : "text-muted-foreground hover:bg-white/5 hover:text-primary"
            )}
          >
            <Car className="h-4 w-4" />
            Auto
          </button>
          <button
            onClick={() => setTypeFilter('moto')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300",
              typeFilter === 'moto' ? "gold-gradient text-black shadow-lg" : "text-muted-foreground hover:bg-white/5 hover:text-primary"
            )}
          >
            <Bike className="h-4 w-4" />
            Moto
          </button>
        </div>
      </div>

      {/* Lista Veicoli */}
      {filteredVehicles.length === 0 ? (
        <div className="py-24 text-center luxury-card rounded-[32px] shadow-2xl border-dashed border-primary/20">
          <div className="bg-primary/10 p-8 rounded-full w-fit mx-auto mb-8 border border-primary/10">
            <Car className="h-16 w-16 text-primary/30" />
          </div>
          <h3 className="text-2xl font-bold text-white gold-text-gradient uppercase">Nessun veicolo trovato</h3>
          <p className="text-muted-foreground mt-3 max-w-sm mx-auto font-medium">
            {data.vehicles.length === 0 
              ? "Inizia aggiungendo il tuo primo veicolo alla collezione di lusso." 
              : "Non abbiamo trovato veicoli che corrispondono alla tua ricerca."}
          </p>
          {data.vehicles.length === 0 && (
            <Button onClick={onAddVehicle} className="mt-10 rounded-xl px-10 h-14 font-bold gold-gradient text-black shadow-2xl shadow-primary/20">
              Aggiungi ora
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map(vehicle => {
            const deadlines = data.legal.find(l => l.vehicleId === vehicle.id);
            return (
              <ModernVehicleCard 
                key={vehicle.id} 
                vehicle={vehicle} 
                deadlines={deadlines}
                onSelect={() => onSelectVehicle?.(vehicle.id)}
                onEdit={() => onEditVehicle?.(vehicle)}
                onDelete={() => setDeleteConfirm(vehicle)}
              />
            );
          })}
        </div>
      )}

      {/* Dialog Eliminazione */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Rimuoverà definitivamente il veicolo
              <span className="font-bold text-foreground"> {deleteConfirm?.brand} {deleteConfirm?.model} </span>
              e tutti i dati associati (spese, manutenzioni, scadenze).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full">
              Elimina Veicolo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ModernVehicleCard({ vehicle, deadlines, onSelect, onEdit, onDelete }: any) {
  const status = useMemo(() => {
    if (!deadlines) return 'ok';
    const dates = [deadlines.insurance?.endDate, deadlines.tax?.dueDate, deadlines.inspection?.nextDate].filter(Boolean) as string[];
    const days = dates.map(d => getDaysUntilExpiry(d));
    if (days.some(d => d < 0)) return 'critical';
    if (days.some(d => d <= 30)) return 'warning';
    return 'ok';
  }, [deadlines]);

  return (
    <div className="luxury-card group overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] border-white/5">
      {/* Immagine/Icona */}
      <div className="relative h-52 bg-black/40 overflow-hidden border-b border-white/5">
        {vehicle.imageUrl ? (
          <div className="w-full h-full p-4 relative">
            <img 
              src={vehicle.imageUrl} 
              alt={vehicle.model} 
              className="w-full h-full object-contain vehicle-shadow transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {vehicle.type === 'moto' ? 
              <Bike className="h-24 w-24 text-primary/10 transition-colors group-hover:text-primary/20" /> : 
              <Car className="h-24 w-24 text-primary/10 transition-colors group-hover:text-primary/20" />
            }
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-5 right-5">
          <Badge className={cn(
            "rounded-full px-4 py-1.5 font-bold shadow-2xl border-0 text-[10px] uppercase tracking-widest",
            status === 'ok' ? "bg-green-500/20 text-green-500 border border-green-500/20" : 
            status === 'warning' ? "bg-primary/20 text-primary border border-primary/20" : 
            "bg-red-500/20 text-red-500 border border-red-500/20"
          )}>
            {status === 'ok' ? "Tutto ok" : status === 'warning' ? "In scadenza" : "Urgente"}
          </Badge>
        </div>

        {/* Tipo Badge */}
        <div className="absolute top-5 left-5">
          <div className="bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-xl group-hover:border-primary/40 transition-colors">
            {vehicle.type === 'auto' ? <Car className="h-5 w-5 text-primary" /> : <Bike className="h-5 w-5 text-primary" />}
          </div>
        </div>
      </div>

      {/* Contenuto */}
      <div className="p-7 space-y-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold text-white group-hover:text-primary transition-colors truncate">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-50 mt-1">
              {vehicle.version || "Versione standard"}
            </p>
          </div>
          <div className="shrink-0">
            <span className="text-[11px] font-bold bg-white/5 text-white px-3 py-1.5 rounded-lg uppercase tracking-[0.15em] border border-white/10 group-hover:border-primary/30 transition-colors">
              {vehicle.plate}
            </span>
          </div>
        </div>

        {/* Stats Rapide */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Gauge className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Km attuali</p>
              <p className="text-sm font-extrabold text-white group-hover:text-primary transition-colors">{formatKm(vehicle.currentKm)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Fuel className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Carburante</p>
              <p className="text-sm font-extrabold text-white group-hover:text-primary transition-colors uppercase">{vehicle.fuel}</p>
            </div>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex items-center gap-3 pt-2">
          <Button 
            onClick={onSelect}
            className="flex-1 gold-gradient text-black font-extrabold rounded-xl h-12 shadow-lg hover:opacity-90 active:scale-[0.98] transition-all border-0"
          >
            <Eye className="h-4 w-4 mr-2" />
            Dettagli
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onEdit}
              className="h-12 w-12 rounded-xl bg-white/5 border-white/10 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all active:scale-[0.95]"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onDelete}
              className="h-12 w-12 rounded-xl bg-red-500/5 border-red-500/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-all active:scale-[0.95]"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}