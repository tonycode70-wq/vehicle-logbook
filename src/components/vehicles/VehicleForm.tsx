import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera, X } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Vehicle, FuelType } from '@/types/vehicle';
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
  imageUrl: z.string().optional(),
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
      imageUrl: vehicle?.imageUrl || '',
      registrationDate: vehicle?.registrationDate || '',
      disabilityExemption: vehicle?.disabilityExemption || false,
    },
  });

  const onSubmit = (data: VehicleFormData) => {
    try {
      const vehicleData = {
        ...data,
        notes: data.notes || '',
        imageUrl: data.imageUrl || undefined,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Foto Veicolo */}
        <div className="flex flex-col items-center gap-4 p-6 luxury-card border-dashed border-primary/20 bg-primary/5 rounded-[24px]">
          <div className="relative group">
            <div className="h-32 w-32 rounded-3xl bg-black/40 border-2 border-primary/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/40 shadow-2xl">
              {form.watch('imageUrl') ? (
                <img src={form.watch('imageUrl')} alt="Preview" className="h-full w-full object-contain vehicle-shadow" />
              ) : (
                <Camera className="h-10 w-10 text-primary/40" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-xl cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all">
              <Camera className="h-4 w-4" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      form.setValue('imageUrl', reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
            {form.watch('imageUrl') && (
              <button 
                type="button"
                onClick={() => form.setValue('imageUrl', '')}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Foto del Veicolo</p>
        </div>

        {/* Tipo Veicolo */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-xs font-bold text-white uppercase tracking-widest opacity-60">Tipo Veicolo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 luxury-card border-white/10 focus:ring-primary/20 rounded-xl bg-white/5">
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-black/95 backdrop-blur-xl border-primary/20 rounded-xl">
                  <SelectItem value="auto" className="focus:bg-primary/10 focus:text-primary">Auto</SelectItem>
                  <SelectItem value="moto" className="focus:bg-primary/10 focus:text-primary">Moto</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Grid principale */}
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-xs font-bold text-white uppercase tracking-widest opacity-60">Marca *</FormLabel>
                <FormControl>
                  <Input placeholder="es. Fiat, BMW, Honda..." className="h-12 luxury-card border-white/10 focus:ring-primary/20 rounded-xl bg-white/5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-xs font-bold text-white uppercase tracking-widest opacity-60">Modello *</FormLabel>
                <FormControl>
                  <Input placeholder="es. 500, Serie 3, CBR..." className="h-12 luxury-card border-white/10 focus:ring-primary/20 rounded-xl bg-white/5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-xs font-bold text-white uppercase tracking-widest opacity-60">Versione / Allestimento</FormLabel>
                <FormControl>
                  <Input placeholder="es. Sport, Lounge..." className="h-12 luxury-card border-white/10 focus:ring-primary/20 rounded-xl bg-white/5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-xs font-bold text-white uppercase tracking-widest opacity-60">Anno *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    className="h-12 luxury-card border-white/10 focus:ring-primary/20 rounded-xl bg-white/5"
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
              <FormItem className="space-y-3">
                <FormLabel className="text-xs font-bold text-white uppercase tracking-widest opacity-60">Colore *</FormLabel>
                <FormControl>
                  <Input placeholder="es. Bianco, Nero, Rosso..." className="h-12 luxury-card border-white/10 focus:ring-primary/20 rounded-xl bg-white/5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fuel"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-xs font-bold text-white uppercase tracking-widest opacity-60">Alimentazione *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 luxury-card border-white/10 focus:ring-primary/20 rounded-xl bg-white/5">
                      <SelectValue placeholder="Seleziona alimentazione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-black/95 backdrop-blur-xl border-primary/20 rounded-xl">
                    {fuelOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className="focus:bg-primary/10 focus:text-primary">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="plate"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-xs font-bold text-white uppercase tracking-widest opacity-60">Targa *</FormLabel>
                <FormControl>
                  <Input placeholder="es. AA123BB" className="h-12 luxury-card border-white/10 focus:ring-primary/20 rounded-xl bg-white/5 uppercase font-mono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentKm"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-xs font-bold text-white uppercase tracking-widest opacity-60">Km Attuali *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    className="h-12 luxury-card border-white/10 focus:ring-primary/20 rounded-xl bg-white/5"
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-xs font-bold text-white uppercase tracking-widest opacity-60">Note</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Altre informazioni importanti..." 
                  className="min-h-[100px] luxury-card border-white/10 focus:ring-primary/20 rounded-xl bg-white/5 resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-6 border-t border-white/5">
          <Button 
            type="submit" 
            className="w-full h-14 gold-gradient text-black font-extrabold text-lg rounded-2xl shadow-2xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all border-0"
          >
            {vehicle ? 'Salva Modifiche Premium' : 'Aggiungi alla Collezione'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
