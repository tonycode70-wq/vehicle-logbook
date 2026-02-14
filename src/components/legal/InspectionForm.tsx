import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addYears } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { DatePresets } from '@/components/ui/date-presets';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { parseDateInput } from '@/lib/utils/dates';

const inspectionSchema = z.object({
  lastDate: z.date({ required_error: 'Data ultima revisione obbligatoria' }),
  nextDate: z.date({ required_error: 'Data prossima revisione obbligatoria' }),
  result: z.enum(['superata', 'non_superata', 'da_effettuare']),
  notes: z.string().optional(),
});

type InspectionFormData = z.infer<typeof inspectionSchema>;

interface InspectionFormProps {
  vehicleId: string;
  onComplete: () => void;
}

export function InspectionForm({ vehicleId, onComplete }: InspectionFormProps) {
  const { data, updateLegalDocument } = useVehicleContext();
  const existing = data.legal.find(l => l.vehicleId === vehicleId)?.inspection;
  const vehicle = data.vehicles.find(v => v.id === vehicleId);

  // Auto-calcolo prima revisione:
  // Auto: immatricolazione + 4 anni, successive ogni 2
  // Moto: immatricolazione + 3 anni, successive ogni 2
  const getAutoNextDate = (lastDate: Date): Date => {
    if (!vehicle) return addYears(lastDate, 2);
    
    const yearsSinceRegistration = new Date().getFullYear() - vehicle.year;
    const isFirstInspection = !existing?.lastDate;
    
    if (isFirstInspection) {
      const firstInterval = vehicle.type === 'moto' ? 3 : 4;
      if (yearsSinceRegistration < firstInterval) {
        return new Date(vehicle.year + firstInterval, 0, 1);
      }
    }
    return addYears(lastDate, 2);
  };

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      lastDate: existing?.lastDate ? new Date(existing.lastDate) : undefined,
      nextDate: existing?.nextDate ? new Date(existing.nextDate) : undefined,
      result: existing?.result || 'da_effettuare',
      notes: existing?.notes || '',
    },
  });

  const lastDate = form.watch('lastDate');

  // Auto-calcolo nextDate basato su lastDate
  React.useEffect(() => {
    if (lastDate && !existing?.nextDate) {
      form.setValue('nextDate', getAutoNextDate(lastDate));
    }
  }, [lastDate, existing?.nextDate, form]);

  const onSubmit = (formData: InspectionFormData) => {
    updateLegalDocument(vehicleId, {
      inspection: {
        id: existing?.id || crypto.randomUUID(),
        vehicleId,
        lastDate: formData.lastDate.toISOString(),
        nextDate: formData.nextDate.toISOString(),
        result: formData.result,
        notes: formData.notes || '',
      },
    });
    toast({ title: 'Revisione salvata', description: 'Dati revisione aggiornati con successo' });
    onComplete();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="lastDate" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Ultima Revisione *</FormLabel>
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
                    toYear={new Date().getFullYear()}
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

          <FormField control={form.control} name="nextDate" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Prossima Revisione *</FormLabel>
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
                    <DatePresets baseDate={lastDate} onSelect={field.onChange} presets={[2, 3, 4]} />
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="result" render={({ field }) => (
          <FormItem>
            <FormLabel>Esito *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleziona esito" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="superata">Superata</SelectItem>
                <SelectItem value="non_superata">Non superata</SelectItem>
                <SelectItem value="da_effettuare">Da effettuare</SelectItem>
              </SelectContent>
            </Select>
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

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onComplete}>Annulla</Button>
          <Button type="submit">Salva</Button>
        </div>
      </form>
    </Form>
  );
}
