import React, { useState } from 'react';
import { Plus, Trash2, CircleDot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Tire, TireType } from '@/types/vehicle';
import { formatDate, formatKm } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

const tireTypeLabels: Record<TireType, string> = {
  estivi: 'Estivi',
  invernali: 'Invernali',
  '4_stagioni': '4 Stagioni',
};

export function TireManager() {
  const { data, addTire, deleteTire } = useVehicleContext();
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Tire | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');

  const [fVehicleId, setFVehicleId] = useState('');
  const [fMountDate, setFMountDate] = useState<Date>(new Date());
  const [fMountKm, setFMountKm] = useState(0);
  const [fBrand, setFBrand] = useState('');
  const [fModel, setFModel] = useState('');
  const [fType, setFType] = useState<TireType>('4_stagioni');
  const [fFrontSize, setFFrontSize] = useState('');
  const [fFrontPressure, setFFrontPressure] = useState(2.2);
  const [fRearSize, setFRearSize] = useState('');
  const [fRearPressure, setFRearPressure] = useState(2.2);
  const [fNotes, setFNotes] = useState('');

  const filtered = (data.tires || [])
    .filter(t => vehicleFilter === 'all' || t.vehicleId === vehicleFilter)
    .sort((a, b) => new Date(b.mountDate).getTime() - new Date(a.mountDate).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fVehicleId) return;
    addTire({
      vehicleId: fVehicleId,
      mountDate: fMountDate.toISOString(),
      mountKm: fMountKm,
      brand: fBrand,
      model: fModel,
      type: fType,
      frontSize: fFrontSize,
      frontPressure: fFrontPressure,
      rearSize: fRearSize,
      rearPressure: fRearPressure,
      notes: fNotes,
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CircleDot className="h-5 w-5" /> Pneumatici
        </h2>
        <Button size="sm" onClick={() => setShowForm(true)} disabled={data.vehicles.length === 0}>
          <Plus className="mr-1 h-4 w-4" /> Aggiungi
        </Button>
      </div>

      {data.vehicles.length > 1 && (
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
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CircleDot className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">Nessun pneumatico registrato</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(tire => {
            const vehicle = data.vehicles.find(v => v.id === tire.vehicleId);
            return (
              <Card key={tire.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{tire.brand} {tire.model}</span>
                        <Badge variant="outline">{vehicle?.brand} {vehicle?.model}</Badge>
                        <Badge variant="secondary">{tireTypeLabels[tire.type]}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                        <div className="flex flex-wrap gap-x-3">
                          <span>Montati: {formatDate(tire.mountDate)}</span>
                          {tire.mountKm > 0 && <span>a {formatKm(tire.mountKm)}</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-3">
                          <span>Ant: {tire.frontSize} ({tire.frontPressure} bar)</span>
                          <span>Post: {tire.rearSize} ({tire.rearPressure} bar)</span>
                        </div>
                      </div>
                      {tire.notes && <p className="text-xs text-muted-foreground mt-1">{tire.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(tire)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuovi Pneumatici</DialogTitle>
            <DialogDescription>Registra un set di pneumatici</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Veicolo *</label>
              <Select value={fVehicleId} onValueChange={v => {
                setFVehicleId(v);
                const veh = data.vehicles.find(x => x.id === v);
                if (veh) setFMountKm(veh.currentKm);
              }}>
                <SelectTrigger><SelectValue placeholder="Seleziona veicolo" /></SelectTrigger>
                <SelectContent>
                  {data.vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.brand} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data montaggio</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full pl-3 text-left font-normal">
                      {format(fMountDate, "dd/MM/yyyy")}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                    <Calendar mode="single" selected={fMountDate} onSelect={d => d && setFMountDate(d)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium">Km montaggio</label>
                <Input type="number" value={fMountKm} onChange={e => setFMountKm(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Marca</label>
                <Input value={fBrand} onChange={e => setFBrand(e.target.value)} placeholder="es. Michelin" />
              </div>
              <div>
                <label className="text-sm font-medium">Modello</label>
                <Input value={fModel} onChange={e => setFModel(e.target.value)} placeholder="es. Pilot Sport 5" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={fType} onValueChange={v => setFType(v as TireType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="estivi">Estivi</SelectItem>
                  <SelectItem value="invernali">Invernali</SelectItem>
                  <SelectItem value="4_stagioni">4 Stagioni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Misura anteriore</label>
                <Input value={fFrontSize} onChange={e => setFFrontSize(e.target.value)} placeholder="es. 225/45 R17" />
              </div>
              <div>
                <label className="text-sm font-medium">Pressione ant. (bar)</label>
                <Input type="number" step="0.1" value={fFrontPressure} onChange={e => setFFrontPressure(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Misura posteriore</label>
                <Input value={fRearSize} onChange={e => setFRearSize(e.target.value)} placeholder="es. 255/40 R17" />
              </div>
              <div>
                <label className="text-sm font-medium">Pressione post. (bar)</label>
                <Input type="number" step="0.1" value={fRearPressure} onChange={e => setFRearPressure(Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Note</label>
              <Textarea value={fNotes} onChange={e => setFNotes(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annulla</Button>
              <Button type="submit" disabled={!fVehicleId}>Salva</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={o => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina pneumatici?</AlertDialogTitle>
            <AlertDialogDescription>{deleteConfirm?.brand} {deleteConfirm?.model}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteConfirm) { deleteTire(deleteConfirm.id); setDeleteConfirm(null); } }} className="bg-destructive text-destructive-foreground">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
