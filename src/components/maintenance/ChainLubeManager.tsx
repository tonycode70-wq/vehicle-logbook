import React, { useState } from 'react';
import { Plus, Trash2, Link2, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
import { ChainLube } from '@/types/vehicle';
import { formatDate, formatKm } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

export function ChainLubeManager() {
  const { data, addChainLube, deleteChainLube } = useVehicleContext();
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ChainLube | null>(null);

  // Solo moto
  const motos = data.vehicles.filter(v => v.type === 'moto');
  const chainLubes = (data.chainLubes || [])
    .filter(c => motos.some(m => m.id === c.vehicleId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [fVehicleId, setFVehicleId] = useState('');
  const [fDate, setFDate] = useState<Date>(new Date());
  const [fKm, setFKm] = useState(0);
  const [fNextKm, setFNextKm] = useState(0);
  const [fNotes, setFNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fVehicleId) return;
    addChainLube({
      vehicleId: fVehicleId,
      date: fDate.toISOString(),
      km: fKm,
      nextKm: fNextKm || fKm + 500,
      notes: fNotes,
    });
    setShowForm(false);
  };

  if (motos.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="h-5 w-5" /> Ingrassaggio Catena
        </h2>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Nessuna moto registrata. L'ingrassaggio catena è disponibile solo per le moto.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="h-5 w-5" /> Ingrassaggio Catena
        </h2>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-1 h-4 w-4" /> Aggiungi
        </Button>
      </div>

      {chainLubes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Link2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">Nessun ingrassaggio registrato</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chainLubes.map(cl => {
            const vehicle = data.vehicles.find(v => v.id === cl.vehicleId);
            const currentKm = vehicle?.currentKm || 0;
            const isOverdue = currentKm >= cl.nextKm;
            const isNear = !isOverdue && (cl.nextKm - currentKm) < 100;
            return (
              <Card key={cl.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{vehicle?.brand} {vehicle?.model}</span>
                        {isOverdue ? (
                          <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Scaduto</Badge>
                        ) : isNear ? (
                          <Badge variant="warning" className="gap-1"><AlertTriangle className="h-3 w-3" /> Quasi</Badge>
                        ) : (
                          <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> OK</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                        <span>{formatDate(cl.date)}</span>
                        <span>a {formatKm(cl.km)}</span>
                        <span>Prossimo: {formatKm(cl.nextKm)}</span>
                      </div>
                      {cl.notes && <p className="text-xs text-muted-foreground mt-1">{cl.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(cl)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuovo Ingrassaggio</DialogTitle>
            <DialogDescription>Registra ingrassaggio catena moto</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Moto *</label>
              <Select value={fVehicleId} onValueChange={v => {
                setFVehicleId(v);
                const veh = motos.find(x => x.id === v);
                if (veh) { setFKm(veh.currentKm); setFNextKm(veh.currentKm + 500); }
              }}>
                <SelectTrigger><SelectValue placeholder="Seleziona moto" /></SelectTrigger>
                <SelectContent>
                  {motos.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.brand} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full pl-3 text-left font-normal">
                    {format(fDate, "dd/MM/yyyy")}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                  <Calendar mode="single" selected={fDate} onSelect={d => d && setFDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Km attuali</label>
                <Input type="number" value={fKm} onChange={e => setFKm(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm font-medium">Prossimo (km)</label>
                <Input type="number" value={fNextKm} onChange={e => setFNextKm(Number(e.target.value))} />
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
            <AlertDialogTitle>Elimina ingrassaggio?</AlertDialogTitle>
            <AlertDialogDescription>{deleteConfirm && formatDate(deleteConfirm.date)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteConfirm) { deleteChainLube(deleteConfirm.id); setDeleteConfirm(null); } }} className="bg-destructive text-destructive-foreground">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
