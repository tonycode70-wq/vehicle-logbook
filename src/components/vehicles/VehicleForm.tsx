import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Vehicle, VehicleType, FuelType } from '@/types/vehicle';
import { toast } from '@/hooks/use-toast';

const vehicleSchema = z.object({
  type: z.enum(['auto', 'moto']),
  brand: z.string().min(1, 'Marca obbligatoria'),
  model: z.string().min(1, 'Modello obbligatorio'),
  version: z.string().optional(),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().min(1, 'Colore obbligatorio'),
  fuel: z.enum(['benzina', 'diesel', 'gpl', 'metano', 'ibrido', 'elettrico']),
  displacement: z.number().min(0),
  power: z.number().min(0),
  plate: z.string().min(1, 'Targa obbligatoria'),
  vin: z.string().min(17, 'VIN deve essere di 17 caratteri').max(17),
  currentKm: z.number().min(0),
  notes: z.string().optional(),
  // NUOVI CAMPI
  registrationDate: z.string().optional(), // YYYY-MM-DD
  disabilityExemption: z.boolean().optional(), // Esenzione Legge 104
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onComplete: () => void;
}

const fuelOptions: { value: FuelType; label: string }[] = [
  { value: 'benzina', label: 'Benzina' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'gpl', label: 'GPL' },
  { value: 'metano', label: 'Metano' },
  { value: 'ibrido', label: 'Ibrido' },
  { value: 'elettrico', label: 'Elettrico' },
];

export function VehicleForm({ vehicle, onComplete }: VehicleFormProps) {
  const { addVehicle, updateVehicle } = useVehicleContext();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      type: vehicle?.type || 'auto',
      brand: vehicle?.brand || '',
      model: vehicle?.model || '',
      version: vehicle?.version || '',
      year: vehicle?.year || new Date().getFullYear(),
      color: vehicle?.color || '',
      fuel: vehicle?.fuel || 'benzina',
      displacement: vehicle?.displacement || 0,
      power: vehicle?.power || 0,
      plate: vehicle?.plate || '',
      vin: vehicle?.vin || '',
      currentKm: vehicle?.currentKm || 0,
      notes: vehicle?.notes || '',
      // NUOVI CAMPI
      registrationDate: vehicle?.registrationDate || '',
      disabilityExemption: vehicle?.disabilityExemption || false,
    },
  });

  const vehicleType = form.watch('type');

  const onSubmit = (data: VehicleFormData) => {
    try {
      const vehicleData = {
        type: data.type,
        brand: data.brand,
        model: data.model,
        version: data.version || '',
        year: data.year,
        color: data.color,
        fuel: data.fuel,
        displacement: data.displacement,
        power: data.power,
        plate: data.plate,
        vin: data.vin,
        currentKm: data.currentKm,
        notes: data.notes || '',
        // NUOVI CAMPI
        registrationDate: data.registrationDate || undefined,
        disabilityExemption: data.disabilityExemption || false,
        euroClass: (data as any).euroClass || '',
      };

      if (vehicle) {
        updateVehicle(vehicle.id, vehicleData);
        toast({
          title: 'Veicolo aggiornato',
          description: `${data.brand} ${data.model} aggiornato con successo`,
        });
      } else {
        addVehicle(vehicleData);
        toast({
          title: 'Veicolo aggiunto',
          description: `${data.brand} ${data.model} aggiunto con successo`,
        });
      }
      onComplete();
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante il salvataggio',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Tipo Veicolo */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Veicolo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="moto">Moto</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Grid principale */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca *</FormLabel>
                <FormControl>
                  <Input placeholder="es. Fiat, BMW, Honda..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modello *</FormLabel>
                <FormControl>
                  <Input placeholder="es. 500, Serie 3, CBR..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Versione / Allestimento</FormLabel>
                <FormControl>
                  <Input placeholder="es. Sport, Lounge..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anno *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Colore *</FormLabel>
                <FormControl>
                  <Input placeholder="es. Bianco, Nero, Rosso..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fuel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alimentazione *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fuelOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="displacement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cilindrata (cc) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="es. 1600" 
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="power"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Potenza (kW) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="es. 75" 
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Targa *</FormLabel>
                <FormControl>
                  <Input placeholder="es. AB123CD" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Km Attuali *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="es. 50000" 
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* VIN */}
        <FormField
          control={form.control}
          name="vin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero di Telaio (VIN) * - 17 caratteri</FormLabel>
              <FormControl>
                <Input 
                  placeholder="es. WVWZZZ3CZWE123456" 
                  maxLength={17}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* NUOVO CAMPO: Data Immatricolazione */}
        <FormField
          control={form.control}
          name="registrationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Immatricolazione</FormLabel>
              <FormControl>
                <Input 
                  type="date"
                  placeholder="YYYY-MM-DD"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Utilizzata per calcolare l'età del veicolo e lo stato del bollo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* NUOVO CAMPO: Esenzione Bollo per Disabilità */}
        <FormField
          control={form.control}
          name="disabilityExemption"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-input p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Esenzione Bollo per Disabilità (Legge 104)
                </FormLabel>
                <FormDescription>
                  Seleziona se il veicolo beneficia dell'esenzione bollo per disabilità
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Note */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Note aggiuntive sul veicolo..." 
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Azioni */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onComplete}>
            Annulla
          </Button>
          <Button type="submit">
            {vehicle ? 'Salva Modifiche' : 'Aggiungi Veicolo'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
