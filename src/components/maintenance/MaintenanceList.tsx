import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Wrench, Calendar } from 'lucide-react';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Manutenzioni</h1>
        <p className="text-muted-foreground">Registro interventi, batteria, pneumatici e catena</p>
      </div>

      <Tabs defaultValue="interventi">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="interventi">Interventi</TabsTrigger>
          <TabsTrigger value="batteria">Batteria</TabsTrigger>
          <TabsTrigger value="pneumatici">Pneumatici</TabsTrigger>
          <TabsTrigger value="catena">Catena</TabsTrigger>
        </TabsList>

        <TabsContent value="interventi" className="space-y-4 mt-4">
          {/* Header */}
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(true)} disabled={data.vehicles.length === 0}>
              <Plus className="mr-2 h-4 w-4" /> Nuova Manutenzione
            </Button>
          </div>

          {/* Filtri */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Cerca..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Tutti i veicoli" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i veicoli</SelectItem>
                    {data.vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.brand} {v.model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista */}
          {data.vehicles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wrench className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">Nessun veicolo registrato</p>
                <p className="text-muted-foreground">Aggiungi prima un veicolo</p>
              </CardContent>
            </Card>
          ) : filteredMaintenance.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wrench className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">Nessuna manutenzione trovata</p>
                <p className="text-muted-foreground">
                  {data.maintenance.length === 0 ? "Registra la tua prima manutenzione" : "Prova a modificare i filtri"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredMaintenance.map(maintenance => {
                const vehicle = data.vehicles.find(v => v.id === maintenance.vehicleId);
                return (
                  <Card key={maintenance.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Wrench className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">{maintenanceTypeLabels[maintenance.type] || maintenance.type}</h3>
                              <Badge variant="secondary">{vehicle?.brand} {vehicle?.model}</Badge>
                              {maintenance.isDiy && <Badge variant="outline">Fai da te</Badge>}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(maintenance.date)}</span>
                              <span>{formatKm(maintenance.km)}</span>
                              {maintenance.workshop && <span>📍 {maintenance.workshop}</span>}
                            </div>
                            {maintenance.spareParts && <p className="mt-1 text-sm text-muted-foreground">Ricambi: {maintenance.spareParts}</p>}
                            {maintenance.notes && <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{maintenance.notes}</p>}
                            {maintenance.nextMaintenanceKm && <p className="mt-1 text-xs text-primary">Prossima: {formatKm(maintenance.nextMaintenanceKm)}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-bold">{formatCurrency(maintenance.cost)}</p>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditMaintenance(maintenance)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(maintenance)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="batteria" className="mt-4">
          <BatteryManager />
        </TabsContent>

        <TabsContent value="pneumatici" className="mt-4">
          <TireManager />
        </TabsContent>

        <TabsContent value="catena" className="mt-4">
          <ChainLubeManager />
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={showForm || !!editMaintenance} onOpenChange={open => { if (!open) { setShowForm(false); setEditMaintenance(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editMaintenance ? 'Modifica Manutenzione' : 'Nuova Manutenzione'}</DialogTitle>
            <DialogDescription>{editMaintenance ? 'Modifica i dati della manutenzione' : 'Registra un nuovo intervento'}</DialogDescription>
          </DialogHeader>
          <MaintenanceForm maintenance={editMaintenance} onComplete={() => { setShowForm(false); setEditMaintenance(null); }} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa manutenzione?<br />
              <strong>{maintenanceTypeLabels[deleteConfirm?.type || ''] || deleteConfirm?.type}</strong> - {formatCurrency(deleteConfirm?.cost || 0)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
