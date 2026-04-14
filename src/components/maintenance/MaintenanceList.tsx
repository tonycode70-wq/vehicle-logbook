import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Wrench, Calendar, Zap, CircleDot, Link as LinkIcon, Gauge } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Maintenance } from '@/types/vehicle';
import { MaintenanceForm } from './MaintenanceForm';
import { BatteryManager } from './BatteryManager';
import { TireManager } from './TireManager';
import { ChainLubeManager } from './ChainLubeManager';
import { formatDate, formatCurrency, formatKm } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

const maintenanceTypeLabels: Record<string, string> = {
  tagliando: 'Tagliando',
  freni: 'Freni',
  gomme: 'Gomme',
  olio: 'Cambio Olio',
  filtri: 'Filtri',
  batteria: 'Batteria',
  frizione: 'Frizione',
  sospensioni: 'Sospensioni',
  altro: 'Altro',
};

export function MaintenanceList() {
  const { data, deleteMaintenance } = useVehicleContext();
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editMaintenance, setEditMaintenance] = useState<Maintenance | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Maintenance | null>(null);

  const filteredMaintenance = data.maintenance
    .filter(m => {
      const vehicle = data.vehicles.find(v => v.id === m.vehicleId);
      const matchSearch = 
        m.type.toLowerCase().includes(search.toLowerCase()) ||
        m.workshop.toLowerCase().includes(search.toLowerCase()) ||
        m.spareParts.toLowerCase().includes(search.toLowerCase()) ||
        vehicle?.brand.toLowerCase().includes(search.toLowerCase()) ||
        vehicle?.model.toLowerCase().includes(search.toLowerCase());
      const matchVehicle = vehicleFilter === 'all' || m.vehicleId === vehicleFilter;
      return matchSearch && matchVehicle;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteMaintenance(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white gold-text-gradient uppercase tracking-tight">Manutenzione</h1>
          <p className="text-muted-foreground font-medium">Registro interventi e gestione componenti premium</p>
        </div>
      </div>

      <Tabs defaultValue="interventi" className="w-full">
        <TabsList className="grid w-full grid-cols-4 luxury-card p-1.5 h-16 border-white/5 shadow-2xl">
          <TabsTrigger value="interventi" className="rounded-xl font-extrabold text-xs uppercase tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-black transition-all gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Interventi</span>
          </TabsTrigger>
          <TabsTrigger value="batteria" className="rounded-xl font-extrabold text-xs uppercase tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-black transition-all gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Batteria</span>
          </TabsTrigger>
          <TabsTrigger value="pneumatici" className="rounded-xl font-extrabold text-xs uppercase tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-black transition-all gap-2">
            <CircleDot className="h-4 w-4" />
            <span className="hidden sm:inline">Gomme</span>
          </TabsTrigger>
          <TabsTrigger value="catena" className="rounded-xl font-extrabold text-xs uppercase tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-black transition-all gap-2">
            <LinkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Catena</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interventi" className="space-y-8 mt-8">
          {/* Header con Tasto */}
          <div className="flex justify-end">
            <Button 
              onClick={() => setShowForm(true)} 
              disabled={data.vehicles.length === 0}
              className="gold-gradient text-black font-extrabold rounded-xl px-6 h-12 shadow-2xl shadow-primary/20 border-0"
            >
              <Plus className="mr-2 h-5 w-5" /> Nuova Manutenzione
            </Button>
          </div>

          {/* Filtri */}
          <div className="luxury-card p-6 border-white/5">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40" />
                <Input 
                  placeholder="Cerca officina, ricambi o tipo intervento..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="pl-12 h-14 luxury-card border-white/10 bg-white/5 rounded-2xl focus:ring-primary/20 placeholder:text-muted-foreground/40 font-medium" 
                />
              </div>
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger className="w-full sm:w-[220px] h-14 luxury-card border-white/10 bg-white/5 rounded-2xl font-bold">
                  <SelectValue placeholder="Tutti i veicoli" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 backdrop-blur-xl border-primary/20 rounded-xl font-bold">
                  <SelectItem value="all" className="focus:bg-primary/10 focus:text-primary">Tutti i veicoli</SelectItem>
                  {data.vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id} className="focus:bg-primary/10 focus:text-primary">{v.brand} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista */}
          {data.vehicles.length === 0 ? (
            <div className="py-24 text-center luxury-card rounded-[32px] border-dashed border-primary/20">
              <Wrench className="mx-auto h-16 w-16 text-primary/20 mb-6" />
              <h3 className="text-2xl font-bold text-white gold-text-gradient uppercase tracking-tight">Nessun veicolo</h3>
              <p className="text-muted-foreground mt-3 font-medium">Aggiungi prima un veicolo per registrare le manutenzioni.</p>
            </div>
          ) : filteredMaintenance.length === 0 ? (
            <div className="py-24 text-center luxury-card rounded-[32px] border-dashed border-primary/20">
              <Wrench className="mx-auto h-16 w-16 text-primary/20 mb-6" />
              <h3 className="text-2xl font-bold text-white gold-text-gradient uppercase tracking-tight">Nessun intervento</h3>
              <p className="text-muted-foreground mt-3 font-medium">Non abbiamo trovato interventi che corrispondono ai tuoi filtri.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredMaintenance.map(maintenance => {
                const vehicle = data.vehicles.find(v => v.id === maintenance.vehicleId);
                return (
                  <div key={maintenance.id} className="luxury-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-primary/30 transition-all border-white/5">
                    <div className="flex items-start gap-5 min-w-0">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/10 text-primary transition-all group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                        <Wrench className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h3 className="text-lg font-extrabold text-white group-hover:text-primary transition-colors">
                            {maintenanceTypeLabels[maintenance.type] || maintenance.type}
                          </h3>
                          <span className="text-[10px] font-bold bg-white/5 text-white/60 px-3 py-1 rounded-lg uppercase tracking-widest border border-white/5">
                            {vehicle?.brand} {vehicle?.model}
                          </span>
                          {maintenance.isDiy && (
                            <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-lg uppercase tracking-widest border border-primary/10">
                              Fai da te
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                            <Calendar className="h-3.5 w-3.5 text-primary/60" />
                            {formatDate(maintenance.date)}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                            <Gauge className="h-3.5 w-3.5 text-primary/60" />
                            {formatKm(maintenance.km)}
                          </div>
                          {maintenance.workshop && (
                            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                              <span className="text-primary/60">📍</span>
                              {maintenance.workshop}
                            </div>
                          )}
                        </div>
                        {maintenance.spareParts && (
                          <p className="mt-3 text-sm font-medium text-muted-foreground/60 border-l-2 border-primary/20 pl-3">
                            Ricambi: {maintenance.spareParts}
                          </p>
                        )}
                        {maintenance.nextMaintenanceKm && (
                          <div className="mt-3 inline-flex items-center gap-2 bg-primary/5 border border-primary/10 px-3 py-1 rounded-lg">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
                              Prossima: {formatKm(maintenance.nextMaintenanceKm)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-white group-hover:text-primary transition-colors">{formatCurrency(maintenance.cost)}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Costo Intervento</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setEditMaintenance(maintenance)}
                          className="h-11 w-11 rounded-xl bg-white/5 border-white/10 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all active:scale-[0.95]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setDeleteConfirm(maintenance)}
                          className="h-11 w-11 rounded-xl bg-red-500/5 border-red-500/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-all active:scale-[0.95]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="batteria" className="mt-8">
          <BatteryManager />
        </TabsContent>

        <TabsContent value="pneumatici" className="mt-8">
          <TireManager />
        </TabsContent>

        <TabsContent value="catena" className="mt-8">
          <ChainLubeManager />
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={showForm || !!editMaintenance} onOpenChange={open => { if (!open) { setShowForm(false); setEditMaintenance(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-2xl border-primary/20 rounded-[32px] p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-extrabold text-white gold-text-gradient uppercase tracking-tight">
              {editMaintenance ? 'Modifica Intervento' : 'Nuovo Intervento Premium'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              {editMaintenance ? 'Aggiorna i dettagli della manutenzione' : 'Registra un nuovo intervento tecnico specializzato'}
            </DialogDescription>
          </DialogHeader>
          <MaintenanceForm maintenance={editMaintenance} onComplete={() => { setShowForm(false); setEditMaintenance(null); }} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-black/95 backdrop-blur-2xl border-primary/20 rounded-[32px] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-extrabold text-white uppercase tracking-tight">Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              Sei sicuro di voler eliminare definitivamente questo intervento?<br />
              <span className="text-primary font-bold mt-2 block">
                {maintenanceTypeLabels[deleteConfirm?.type || ''] || deleteConfirm?.type} - {formatCurrency(deleteConfirm?.cost || 0)}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-xl font-bold bg-white/5 border-white/10 text-white hover:bg-white/10">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 border-0 shadow-lg shadow-red-500/20">Elimina Definitivamente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
