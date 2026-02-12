import React, { useState } from 'react';
import { Plus, Car, Bike, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { VehicleForm } from './VehicleForm';
import { formatKm, formatDate } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

// --- MODIFICA: Interfaccia Props aggiornata per risolvere l'errore in Index.tsx ---
interface VehicleListProps {
  onSelectVehicle?: (id: string) => void;
  onEditVehicle?: (vehicle: Vehicle) => void; // <--- Aggiunta questa proprietà
}

export function VehicleList({ onSelectVehicle, onEditVehicle }: VehicleListProps) {
  const { data, deleteVehicle } = useVehicleContext();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'auto' | 'moto'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
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

  // Funzione per gestire la modifica: se passata da Index usa quella, altrimenti usa lo stato interno
  const handleEditClick = (vehicle: Vehicle) => {
    if (onEditVehicle) {
      onEditVehicle(vehicle);
    } else {
      setEditVehicle(vehicle);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Veicoli</h1>
          <p className="text-muted-foreground">Gestisci i tuoi veicoli</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Veicolo
        </Button>
      </div>

      {/* Filtri */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cerca per marca, modello o targa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('all')}
              >
                Tutti
              </Button>
              <Button
                variant={typeFilter === 'auto' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('auto')}
              >
                <Car className="mr-1 h-4 w-4" />
                Auto
              </Button>
              <Button
                variant={typeFilter === 'moto' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('moto')}
              >
                <Bike className="mr-1 h-4 w-4" />
                Moto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista Veicoli */}
      {filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">Nessun veicolo trovato</p>
            <p className="text-muted-foreground">
              {data.vehicles.length === 0 
                ? "Aggiungi il tuo primo veicolo per iniziare" 
                : "Prova a modificare i filtri di ricerca"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map(vehicle => (
            <Card key={vehicle.id} className="group relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    vehicle.type === 'auto' ? "bg-primary/10" : "bg-accent"
                  )}>
                    {vehicle.type === 'auto' ? (
                      <Car className="h-5 w-5 text-primary" />
                    ) : (
                      <Bike className="h-5 w-5 text-accent-foreground" />
                    )}
                  </div>
                  <Badge variant="secondary">
                    {vehicle.type === 'auto' ? 'Auto' : 'Moto'}
                  </Badge>
                </div>
                <CardTitle className="mt-2">
                  {vehicle.brand} {vehicle.model}
                </CardTitle>
                <CardDescription>
                  {vehicle.version} • {vehicle.year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Targa</span>
                    <span className="font-medium">{vehicle.plate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chilometri</span>
                    <span className="font-medium">{formatKm(vehicle.currentKm)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alimentazione</span>
                    <span className="font-medium capitalize">{vehicle.fuel}</span>
                  </div>
                </div>

                {/* Azioni */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onSelectVehicle?.(vehicle.id)}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    Dettagli
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditClick(vehicle)} // <--- Utilizzo della funzione centralizzata
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteConfirm(vehicle)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog interno (per Nuovo Veicolo) */}
      <Dialog open={showForm || (!!editVehicle && !onEditVehicle)} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditVehicle(null);
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editVehicle ? 'Modifica Veicolo' : 'Nuovo Veicolo'}
            </DialogTitle>
            <DialogDescription>
              {editVehicle 
                ? 'Modifica i dati del veicolo' 
                : 'Inserisci i dati del nuovo veicolo'}
            </DialogDescription>
          </DialogHeader>
          <VehicleForm 
            vehicle={editVehicle} 
            onComplete={() => {
              setShowForm(false);
              setEditVehicle(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare <strong>{deleteConfirm?.brand} {deleteConfirm?.model}</strong>?
              Questa azione eliminerà anche tutte le manutenzioni, spese e documenti associati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}