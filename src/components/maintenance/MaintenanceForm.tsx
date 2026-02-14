import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { DatePresets } from '@/components/ui/date-presets';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Maintenance, MaintenanceType } from '@/types/vehicle';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { parseDateInput } from '@/lib/utils/dates';

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Seleziona un veicolo'),
  date: z.date({ required_error: 'Data obbligatoria' }),
  km: z.number().min(0, 'Chilometri non validi'),
  type: z.enum(['tagliando', 'freni', 'gomme', 'olio', 'filtri', 'batteria', 'frizione', 'sospensioni', 'altro']),
  workshop: z.string().optional(),
  isDiy: z.boolean(),
  spareParts: z.string().optional(),
  cost: z.number().min(0, 'Costo non valido'),
  notes: z.string().optional(),
  nextMaintenanceKm: z.number().optional().nullable(),
  nextMaintenanceDate: z.date().optional().nullable(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceFormProps {
  maintenance?: Maintenance | null;
  onComplete: () => void;
}

const maintenanceTypes: { value: MaintenanceType; label: string }[] = [
  { value: 'tagliando', label: 'Tagliando' },
  { value: 'freni', label: 'Freni' },
  { value: 'gomme', label: 'Gomme' },
  { value: 'olio', label: 'Cambio Olio' },
  { value: 'filtri', label: 'Filtri' },
  { value: 'batteria', label: 'Batteria' },
  { value: 'frizione', label: 'Frizione' },
  { value: 'sospensioni', label: 'Sospensioni' },
  { value: 'altro', label: 'Altro' },
];

export function MaintenanceForm({ maintenance, onComplete }: MaintenanceFormProps) {
  const { data, addMaintenance, updateMaintenance } = useVehicleContext();

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicleId: maintenance?.vehicleId || '',
      date: maintenance?.date ? new Date(maintenance.date) : new Date(),
      km: maintenance?.km || 0,
      type: maintenance?.type || 'tagliando',
      workshop: maintenance?.workshop || '',
      isDiy: maintenance?.isDiy || false,
      spareParts: maintenance?.spareParts || '',
      cost: maintenance?.cost || 0,
      notes: maintenance?.notes || '',
      nextMaintenanceKm: maintenance?.nextMaintenanceKm || null,
      nextMaintenanceDate: maintenance?.nextMaintenanceDate ? new Date(maintenance.nextMaintenanceDate) : null,
    },
  });

  const isDiy = form.watch('isDiy');

  const onSubmit = (formData: MaintenanceFormData) => {
    const maintenanceData = {
      vehicleId: formData.vehicleId,
      date: formData.date.toISOString(),
      km: formData.km,
      type: formData.type,
      workshop: formData.workshop || '',
      isDiy: formData.isDiy,
      spareParts: formData.spareParts || '',
      cost: formData.cost,
      notes: formData.notes || '',
      nextMaintenanceKm: formData.nextMaintenanceKm || null,
      nextMaintenanceDate: formData.nextMaintenanceDate?.toISOString() || null,
    };

    if (maintenance) {
      updateMaintenance(maintenance.id, maintenanceData);
      toast({ title: 'Manutenzione aggiornata', description: 'Dati salvati con successo' });
    } else {
      addMaintenance(maintenanceData);
      toast({ title: 'Manutenzione registrata', description: 'Intervento aggiunto con successo' });
    }
    onComplete();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="vehicleId" render={({ field }) => (
          <FormItem>
            <FormLabel>Veicolo *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Seleziona veicolo" /></SelectTrigger></FormControl>
              <SelectContent>
                {data.vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "dd/MM/yyyy") : "gg/mm/aaaa"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                  <Calendar 
                    mode="single" 
                    selected={field.value} 
                    onSelect={field.onChange} 
                    captionLayout="dropdown"
                    fromYear={1980}
                    toYear={new Date().getFullYear() + 1}
                    initialFocus 
                  />
                  <div className="border-t px-3 py-2">
                    <Input 
                      placeholder="gg/mm/aaaa" 
                      defaultValue={field.value ? format(field.value, "dd/MM/yyyy") : ""} 
                      onBlur={e => {
                        const d = parseDateInput(e.target.value);
                        if (d) field.onChange(d);
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="km" render={({ field }) => (
            <FormItem>
              <FormLabel>Chilometri *</FormLabel>
              <FormControl>
                <Input type="number" placeholder="es. 50000" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Intervento *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleziona tipo" /></SelectTrigger></FormControl>
                <SelectContent>
                  {maintenanceTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="cost" render={({ field }) => (
            <FormItem>
              <FormLabel>Costo (€) *</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="es. 150.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="isDiy" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>Fai da te</FormLabel>
              <FormDescription>Intervento eseguito in autonomia</FormDescription>
            </div>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />

        {!isDiy && (
          <FormField control={form.control} name="workshop" render={({ field }) => (
            <FormItem>
              <FormLabel>Officina</FormLabel>
              <FormControl><Input placeholder="Nome officina / meccanico" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="spareParts" render={({ field }) => (
          <FormItem>
            <FormLabel>Ricambi utilizzati</FormLabel>
            <FormControl><Input placeholder="es. Pastiglie freno, filtro olio..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Note</FormLabel>
            <FormControl><Textarea placeholder="Note aggiuntive..." rows={2} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="rounded-lg border p-4 space-y-4">
          <h4 className="font-medium">Prossima Manutenzione (opzionale)</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="nextMaintenanceKm" render={({ field }) => (
              <FormItem>
                <FormLabel>Km consigliati</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="es. 60000" value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="nextMaintenanceDate" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data consigliata</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "dd/MM/yyyy") : "gg/mm/aaaa"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                    <Calendar 
                      mode="single" 
                      selected={field.value || undefined} 
                      onSelect={field.onChange} 
                      captionLayout="dropdown"
                      fromYear={new Date().getFullYear()}
                      toYear={new Date().getFullYear() + 5}
                      initialFocus 
                    />
                    <div className="border-t px-3 py-2 space-y-2">
                      <Input 
                        placeholder="gg/mm/aaaa" 
                        defaultValue={field.value ? format(field.value, "dd/MM/yyyy") : ""} 
                        onBlur={e => {
                          const d = parseDateInput(e.target.value);
                          if (d) field.onChange(d);
                        }}
                      />
                      <DatePresets onSelect={field.onChange} presets={[1, 2]} />
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onComplete}>Annulla</Button>
          <Button type="submit">{maintenance ? 'Salva Modifiche' : 'Registra Manutenzione'}</Button>
        </div>
      </form>
    </Form>
  );
}
