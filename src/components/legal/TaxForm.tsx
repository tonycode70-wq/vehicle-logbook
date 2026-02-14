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
import { parseDateInput } from '@/lib/utils/dates';

const taxSchema = z.object({
  year: z.number().min(2000).max(2100),
  region: z.string().optional(),
  dueDate: z.date({ required_error: 'Data scadenza obbligatoria' }),
  paidDate: z.date().optional().nullable(),
  amount: z.number().min(0, 'Importo non valido'),
  notes: z.string().optional(),
});

type TaxFormData = z.infer<typeof taxSchema>;

interface TaxFormProps {
  vehicleId: string;
  onComplete: () => void;
}

const regions = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
  'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto'
];

export function TaxForm({ vehicleId, onComplete }: TaxFormProps) {
  const { data, updateLegalDocument } = useVehicleContext();
  const existing = data.legal.find(l => l.vehicleId === vehicleId)?.tax;

  const form = useForm<TaxFormData>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      year: existing?.year || new Date().getFullYear(),
      region: existing?.region || '',
      dueDate: existing?.dueDate ? new Date(existing.dueDate) : undefined,
      paidDate: existing?.paidDate ? new Date(existing.paidDate) : null,
      amount: existing?.amount || 0,
      notes: existing?.notes || '',
    },
  });

  const paidDate = form.watch('paidDate');

  // Auto-calcolo: paidDate + 1 anno = dueDate (se non già impostata)
  React.useEffect(() => {
    if (paidDate && !existing?.dueDate) {
      form.setValue('dueDate', addYears(paidDate, 1));
    }
  }, [paidDate, existing?.dueDate, form]);

  const onSubmit = (formData: TaxFormData) => {
    updateLegalDocument(vehicleId, {
      tax: {
        id: existing?.id || crypto.randomUUID(),
        vehicleId,
        year: formData.year,
        region: formData.region || '',
        dueDate: formData.dueDate.toISOString(),
        paidDate: formData.paidDate ? formData.paidDate.toISOString() : null,
        amount: formData.amount,
        notes: formData.notes || '',
      },
    });
    toast({ title: 'Bollo salvato', description: 'Dati bollo aggiornati con successo' });
    onComplete();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="year" render={({ field }) => (
            <FormItem>
              <FormLabel>Anno *</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="region" render={({ field }) => (
            <FormItem>
              <FormLabel>Regione</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...field}
                >
                  <option value="">Seleziona regione</option>
                  {regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="paidDate" render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Data Pagamento</FormLabel>
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
                  fromYear={new Date().getFullYear() - 10}
                  toYear={new Date().getFullYear()}
                  initialFocus 
                />
                <div className="border-t px-3 py-2">
                  <Input 
                    placeholder="gg/mm/aaaa" 
                    defaultValue={field.value ? format(field.value, "dd/MM/yyyy") : ""} 
                    onBlur={e => {
                      const d = parseDateInput(e.target.value);
                      field.onChange(d || null);
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="dueDate" render={({ field }) => (
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
                <Calendar 
                  mode="single" 
                  selected={field.value} 
                  onSelect={field.onChange} 
                  captionLayout="dropdown"
                  fromYear={new Date().getFullYear() - 1}
                  toYear={new Date().getFullYear() + 2}
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
                  <DatePresets baseDate={paidDate || undefined} onSelect={field.onChange} presets={[1]} />
                </div>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel>Importo (€) *</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" placeholder="es. 200.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
