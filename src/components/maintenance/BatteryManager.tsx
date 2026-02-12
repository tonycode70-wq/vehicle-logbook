import React, { useState } from 'react';
import { Plus, Trash2, Battery as BatteryIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { format, differenceInMonths } from 'date-fns';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Battery, BatteryStatus } from '@/types/vehicle';
import { formatDate } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

function getBatteryStatus(installDate: string, replaceDate: string | null): BatteryStatus {
  if (replaceDate) return 'da_sostituire';
  const months = differenceInMonths(new Date(), new Date(installDate));
  if (months >= 48) return 'da_sostituire';
  if (months >= 36) return 'da_controllare';
  return 'ok';
}

function getBatteryDuration(installDate: string): string {
  const months = differenceInMonths(new Date(), new Date(installDate));
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years > 0) return `${years}a ${rem}m`;
  return `${rem}m`;
}

export function BatteryManager() {
  const { data, addBattery, deleteBattery } = useVehicleContext();
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Battery | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');

  // Form state
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formInstallDate, setFormInstallDate] = useState<Date>(new Date());
  const [formBrand, setFormBrand] = useState('');
  const [formVoltage, setFormVoltage] = useState(12);
  const [formAmperage, setFormAmperage] = useState(0);
  const [formNotes, setFormNotes] = useState('');

  const filtered = (data.batteries || [])
    .filter(b => vehicleFilter === 'all' || b.vehicleId === vehicleFilter)
    .sort((a, b) => new Date(b.installDate).getTime() - new Date(a.installDate).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVehicleId) return;
    addBattery({
      vehicleId: formVehicleId,
      installDate: formInstallDate.toISOString(),
      replaceDate: null,
      brand: formBrand,
      voltage: formVoltage,
      amperage: formAmperage,
      notes: formNotes,
    });
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormVehicleId('');
    setFormBrand('');
    setFormVoltage(12);
    setFormAmperage(0);
    setFormNotes('');
    setFormInstallDate(new Date());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BatteryIcon className="h-5 w-5" /> Batteria
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
            <BatteryIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">Nessuna batteria registrata</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(battery => {
            const vehicle = data.vehicles.find(v => v.id === battery.vehicleId);
            const status = getBatteryStatus(battery.installDate, battery.replaceDate);
            return (
              <Card key={battery.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{battery.brand || 'Batteria'}</span>
                        <Badge variant="outline">{vehicle?.brand} {vehicle?.model}</Badge>
                        <Badge variant={status === 'ok' ? 'success' : status === 'da_controllare' ? 'warning' : 'destructive'}>
                          {status === 'ok' ? 'OK' : status === 'da_controllare' ? 'Controllare' : 'Sostituire'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                        <span>{battery.voltage}V / {battery.amperage}Ah</span>
                        <span>Installata: {formatDate(battery.installDate)}</span>
                        <span>Durata: {getBatteryDuration(battery.installDate)}</span>
                      </div>
                      {battery.notes && <p className="text-xs text-muted-foreground mt-1">{battery.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(battery)}>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuova Batteria</DialogTitle>
            <DialogDescription>Registra una nuova batteria</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Veicolo *</label>
              <Select value={formVehicleId} onValueChange={setFormVehicleId}>
                <SelectTrigger><SelectValue placeholder="Seleziona veicolo" /></SelectTrigger>
                <SelectContent>
                  {data.vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.brand} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Data installazione *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full pl-3 text-left font-normal")}>
                    {format(formInstallDate, "dd/MM/yyyy")}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                  <Calendar mode="single" selected={formInstallDate} onSelect={(d) => d && setFormInstallDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium">Marca</label>
              <Input value={formBrand} onChange={e => setFormBrand(e.target.value)} placeholder="es. Bosch, Varta..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Voltaggio (V)</label>
                <Input type="number" value={formVoltage} onChange={e => setFormVoltage(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm font-medium">Amperaggio (Ah)</label>
                <Input type="number" value={formAmperage} onChange={e => setFormAmperage(Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Note</label>
              <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annulla</Button>
              <Button type="submit" disabled={!formVehicleId}>Salva</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={o => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina batteria?</AlertDialogTitle>
            <AlertDialogDescription>{deleteConfirm?.brand} - {deleteConfirm?.voltage}V</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteConfirm) { deleteBattery(deleteConfirm.id); setDeleteConfirm(null); } }} className="bg-destructive text-destructive-foreground">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
