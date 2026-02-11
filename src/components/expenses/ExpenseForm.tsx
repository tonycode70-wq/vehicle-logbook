import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Info } from 'lucide-react';
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
import { Expense, ExpenseCategory, PaymentMethod } from '@/types/vehicle';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const expenseSchema = z.object({
  vehicleId: z.string().min(1, 'Seleziona un veicolo'),
  category: z.enum([
    'carburante', 'parcheggio', 'pedaggi', 'lavaggio', 'accessori',
    'assicurazione', 'bollo', 'revisione', 'tasse', 'pneumatici', 'altro'
  ]),
  date: z.date({ required_error: 'Data obbligatoria' }),
  amount: z.number().min(0.01, 'Importo non valido'),
  paymentMethod: z.enum(['contanti', 'carta', 'bonifico', 'altro']),
  description: z.string().optional(),
  km: z.number().min(0),
  validityStart: z.date().optional().nullable(),
  validityEnd: z.date().optional().nullable(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: Expense | null;
  onComplete: () => void;
}

const categories: { value: ExpenseCategory; label: string; isLegal?: boolean }[] = [
  { value: 'carburante', label: 'Carburante' },
  { value: 'parcheggio', label: 'Parcheggio' },
  { value: 'pedaggi', label: 'Pedaggi' },
  { value: 'lavaggio', label: 'Lavaggio' },
  { value: 'accessori', label: 'Accessori' },
  { value: 'assicurazione', label: '🛡️ Assicurazione', isLegal: true },
  { value: 'bollo', label: '📄 Bollo', isLegal: true },
  { value: 'revisione', label: '🔧 Revisione', isLegal: true },
  { value: 'tasse', label: 'Tasse' },
  { value: 'pneumatici', label: 'Pneumatici' },
  { value: 'altro', label: 'Altro' },
];

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'contanti', label: 'Contanti' },
  { value: 'carta', label: 'Carta' },
  { value: 'bonifico', label: 'Bonifico' },
  { value: 'altro', label: 'Altro' },
];

export function ExpenseForm({ expense, onComplete }: ExpenseFormProps) {
  const { data, addExpense, updateExpense, updateLegalDocument } = useVehicleContext();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vehicleId: expense?.vehicleId || (data.vehicles.length === 1 ? data.vehicles[0].id : ''),
      category: expense?.category || 'carburante',
      date: expense?.date ? new Date(expense.date) : new Date(),
      amount: expense?.amount || 0,
      paymentMethod: expense?.paymentMethod || 'carta',
      description: expense?.description || '',
      km: expense?.km || 0,
      validityStart: expense?.validityStart ? new Date(expense.validityStart) : null,
      validityEnd: expense?.validityEnd ? new Date(expense.validityEnd) : null,
    },
  });

  const selectedCategory = form.watch('category');
  const selectedVehicleId = form.watch('vehicleId');
  const isLegalExpense = ['assicurazione', 'bollo', 'revisione'].includes(selectedCategory);

  useEffect(() => {
    if (selectedVehicleId && !expense) {
      const vehicle = data.vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle && vehicle.currentKm > 0) {
        form.setValue('km', vehicle.currentKm);
      }
    }
  }, [selectedVehicleId, data.vehicles, expense, form]);

  const onSubmit = (formData: ExpenseFormData) => {
    const expenseData = {
      vehicleId: formData.vehicleId,
      category: formData.category,
      date: formData.date.toISOString(),
      amount: formData.amount,
      paymentMethod: formData.paymentMethod,
      description: formData.description || '',
      km: formData.km,
      validityStart: formData.validityStart?.toISOString(),
      validityEnd: formData.validityEnd?.toISOString(),
    };

    if (expense) {
      updateExpense(expense.id, expenseData);
      toast({ title: 'Spesa aggiornata', description: 'Dati salvati con successo' });
    } else {
      addExpense(expenseData);
      toast({ title: 'Spesa registrata', description: 'Spesa aggiunta con successo' });
    }

    if (isLegalExpense && formData.validityEnd && formData.vehicleId) {
      if (formData.category === 'assicurazione' && formData.validityStart) {
        updateLegalDocument(formData.vehicleId, {
          insurance: {
            id: crypto.randomUUID(), vehicleId: formData.vehicleId,
            company: formData.description || 'Da specificare', policyNumber: '',
            startDate: formData.validityStart.toISOString(), endDate: formData.validityEnd.toISOString(),
            amount: formData.amount, notes: `Registrata da spesa il ${format(new Date(), 'dd/MM/yyyy')}`,
          },
        });
      } else if (formData.category === 'bollo') {
        updateLegalDocument(formData.vehicleId, {
          tax: {
            id: crypto.randomUUID(), vehicleId: formData.vehicleId,
            year: new Date().getFullYear(), region: formData.description || '',
            dueDate: formData.validityEnd.toISOString(),
            paidDate: formData.date.toISOString(),
            amount: formData.amount, notes: `Registrato da spesa il ${format(new Date(), 'dd/MM/yyyy')}`,
          },
        });
      } else if (formData.category === 'revisione') {
        updateLegalDocument(formData.vehicleId, {
          inspection: {
            id: crypto.randomUUID(), vehicleId: formData.vehicleId,
            lastDate: formData.date.toISOString(), nextDate: formData.validityEnd.toISOString(),
            result: 'superata', cost: formData.amount,
            notes: `Registrata da spesa il ${format(new Date(), 'dd/MM/yyyy')}`,
          },
        });
      }
    }

    onComplete();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="vehicleId" render={({ field }) => (
          <FormItem>
            <FormLabel>Veicolo *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
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
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleziona categoria" /></SelectTrigger></FormControl>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

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
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Importo (€) *</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="es. 50.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="paymentMethod" render={({ field }) => (
            <FormItem>
              <FormLabel>Metodo Pagamento *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger></FormControl>
                <SelectContent>
                  {paymentMethods.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="km" render={({ field }) => (
          <FormItem>
            <FormLabel>Chilometri al momento</FormLabel>
            <FormControl>
              <Input type="number" placeholder="es. 50000" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {isLegalExpense && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">Spesa Legale</p>
                <p className="text-muted-foreground">Inserisci le date di validità per aggiornare automaticamente lo Stato Legale.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {selectedCategory === 'assicurazione' && (
                <FormField control={form.control} name="validityStart" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Inizio Validità</FormLabel>
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
                        <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="validityEnd" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Scadenza</FormLabel>
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
                      <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                      <div className="border-t px-3 py-2">
                        <DatePresets onSelect={field.onChange} presets={[1, 2, 3, 5]} />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
        )}

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>
              {isLegalExpense
                ? (selectedCategory === 'assicurazione' ? 'Compagnia / Note' :
                   selectedCategory === 'bollo' ? 'Regione / Note' : 'Note')
                : 'Descrizione'}
            </FormLabel>
            <FormControl>
              <Textarea placeholder={isLegalExpense ? "es. UnipolSai, Generali..." : "Descrizione opzionale..."} rows={2} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onComplete}>Annulla</Button>
          <Button type="submit">{expense ? 'Salva Modifiche' : 'Registra Spesa'}</Button>
        </div>
      </form>
    </Form>
  );
}
