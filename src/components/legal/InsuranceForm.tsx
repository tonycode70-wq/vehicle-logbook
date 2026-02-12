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
import { useVehicleContext } from '@/contexts/VehicleContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const insuranceSchema = z.object({
  company: z.string().min(1, 'Compagnia obbligatoria'),
  policyNumber: z.string().min(1, 'Numero polizza obbligatorio'),
  startDate: z.date({ required_error: 'Data inizio obbligatoria' }),
  endDate: z.date({ required_error: 'Data fine obbligatoria' }),
  amount: z.number().min(0, 'Importo non valido'),
  notes: z.string().optional(),
});

type InsuranceFormData = z.infer<typeof insuranceSchema>;

interface InsuranceFormProps {
  vehicleId: string;
  onComplete: () => void;
}

export function InsuranceForm({ vehicleId, onComplete }: InsuranceFormProps) {
  const { data, updateLegalDocument } = useVehicleContext();
  const existing = data.legal.find(l => l.vehicleId === vehicleId)?.insurance;

  const form = useForm<InsuranceFormData>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      company: existing?.company || '',
      policyNumber: existing?.policyNumber || '',
      startDate: existing?.startDate ? new Date(existing.startDate) : undefined,
      endDate: existing?.endDate ? new Date(existing.endDate) : undefined,
      amount: existing?.amount || 0,
      notes: existing?.notes || '',
    },
  });

  const startDate = form.watch('startDate');

  // Auto-calcolo: startDate + 1 anno = endDate
  React.useEffect(() => {
    if (startDate && !existing?.endDate) {
      form.setValue('endDate', addYears(startDate, 1));
    }
  }, [startDate, existing?.endDate, form]);

  const onSubmit = (formData: InsuranceFormData) => {
    updateLegalDocument(vehicleId, {
      insurance: {
        id: existing?.id || crypto.randomUUID(),
        vehicleId,
        company: formData.company,
        policyNumber: formData.policyNumber,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        amount: formData.amount,
        notes: formData.notes || '',
      },
    });
    toast({ title: 'Assicurazione salvata', description: 'Dati assicurazione aggiornati con successo' });
    onComplete();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="company" render={({ field }) => (
          <FormItem>
            <FormLabel>Compagnia Assicurativa *</FormLabel>
            <FormControl><Input placeholder="es. UnipolSai, Generali..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="policyNumber" render={({ field }) => (
          <FormItem>
            <FormLabel>Numero Polizza *</FormLabel>
            <FormControl><Input placeholder="es. 123456789" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="startDate" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Inizio *</FormLabel>
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
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Scadenza *</FormLabel>
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
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  <div className="border-t px-3 py-2">
                    <DatePresets baseDate={startDate} onSelect={field.onChange} presets={[1]} />
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel>Importo (€) *</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" placeholder="es. 450.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
            </FormControl>
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
