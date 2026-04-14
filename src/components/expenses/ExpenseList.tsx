import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Wallet, Calendar, Fuel, ParkingCircle, Car, Shield, FileText, Wrench, Receipt, CreditCard, CircleDot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Expense, ExpenseCategory } from '@/types/vehicle';
import { ExpenseForm } from './ExpenseForm';
import { formatDate, formatCurrency, formatKm } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

const categoryLabels: Record<ExpenseCategory, string> = {
  carburante: 'Carburante',
  parcheggio: 'Parcheggio',
  pedaggi: 'Pedaggi',
  lavaggio: 'Lavaggio',
  accessori: 'Accessori',
  assicurazione: 'Assicurazione',
  bollo: 'Bollo',
  revisione: 'Revisione',
  tasse: 'Tasse',
  pneumatici: 'Pneumatici',
  altro: 'Altro',
};

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  carburante: <Fuel className="h-5 w-5" />,
  parcheggio: <ParkingCircle className="h-5 w-5" />,
  pedaggi: <Car className="h-5 w-5" />,
  lavaggio: <Car className="h-5 w-5" />,
  accessori: <CreditCard className="h-5 w-5" />,
  assicurazione: <Shield className="h-5 w-5" />,
  bollo: <FileText className="h-5 w-5" />,
  revisione: <Wrench className="h-5 w-5" />,
  tasse: <Receipt className="h-5 w-5" />,
  pneumatici: <CircleDot className="h-5 w-5" />,
  altro: <Wallet className="h-5 w-5" />,
};

const categoryColors: Record<ExpenseCategory, string> = {
  carburante: 'bg-primary/10 border-primary/20',
  parcheggio: 'bg-white/5 border-white/10',
  pedaggi: 'bg-white/5 border-white/10',
  lavaggio: 'bg-white/5 border-white/10',
  accessori: 'bg-white/5 border-white/10',
  assicurazione: 'bg-primary/20 border-primary/30',
  bollo: 'bg-primary/20 border-primary/30',
  revisione: 'bg-primary/20 border-primary/30',
  tasse: 'bg-white/5 border-white/10',
  pneumatici: 'bg-white/5 border-white/10',
  altro: 'bg-white/5 border-white/10',
};

export function ExpenseList() {
  const { data, deleteExpense } = useVehicleContext();
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null);

  // Memoize filtered expenses to prevent re-renders
  const filteredExpenses = useMemo(() => {
    return data.expenses
      .filter(e => {
        const vehicle = data.vehicles.find(v => v.id === e.vehicleId);
        const matchSearch = 
          e.description.toLowerCase().includes(search.toLowerCase()) ||
          e.category.toLowerCase().includes(search.toLowerCase()) ||
          vehicle?.brand.toLowerCase().includes(search.toLowerCase()) ||
          vehicle?.model.toLowerCase().includes(search.toLowerCase());
        const matchVehicle = vehicleFilter === 'all' || e.vehicleId === vehicleFilter;
        const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
        return matchSearch && matchVehicle && matchCategory;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.expenses, data.vehicles, search, vehicleFilter, categoryFilter]);

  // Memoize total calculation
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteExpense(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white gold-text-gradient uppercase tracking-tight">Registro Spese</h1>
          <p className="text-muted-foreground font-medium">Tracciamento premium di tutti i costi automotive</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)} 
          disabled={data.vehicles.length === 0}
          className="gold-gradient text-black font-extrabold rounded-xl px-6 h-12 shadow-2xl shadow-primary/20 border-0"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nuova Spesa
        </Button>
      </div>

      {/* Filtri */}
      <div className="luxury-card p-6 border-white/5">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40" />
            <Input
              placeholder="Cerca per descrizione, marca o categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 luxury-card border-white/10 bg-white/5 rounded-2xl focus:ring-primary/20 placeholder:text-muted-foreground/40 font-medium"
            />
          </div>
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-full sm:w-[220px] h-14 luxury-card border-white/10 bg-white/5 rounded-2xl font-bold">
              <SelectValue placeholder="Tutti i veicoli" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 backdrop-blur-xl border-primary/20 rounded-xl font-bold">
              <SelectItem value="all" className="focus:bg-primary/10 focus:text-primary">Tutti i veicoli</SelectItem>
              {data.vehicles.map(v => (
                <SelectItem key={v.id} value={v.id} className="focus:bg-primary/10 focus:text-primary">
                  {v.brand} {v.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[220px] h-14 luxury-card border-white/10 bg-white/5 rounded-2xl font-bold">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 backdrop-blur-xl border-primary/20 rounded-xl font-bold">
              <SelectItem value="all" className="focus:bg-primary/10 focus:text-primary">Tutte le categorie</SelectItem>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key} className="focus:bg-primary/10 focus:text-primary">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Totale */}
      {filteredExpenses.length > 0 && (
        <div className="luxury-card p-6 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Volume totale spese filtrate</span>
            <span className="text-3xl font-extrabold text-white gold-text-gradient drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      )}

      {/* Lista */}
      {data.vehicles.length === 0 ? (
        <div className="py-24 text-center luxury-card rounded-[32px] border-dashed border-primary/20">
          <Wallet className="mx-auto h-16 w-16 text-primary/20 mb-6" />
          <h3 className="text-2xl font-bold text-white gold-text-gradient uppercase tracking-tight">Nessun veicolo</h3>
          <p className="text-muted-foreground mt-3 font-medium">Aggiungi prima un veicolo per iniziare a tracciare le tue spese.</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="py-24 text-center luxury-card rounded-[32px] border-dashed border-primary/20">
          <Receipt className="mx-auto h-16 w-16 text-primary/20 mb-6" />
          <h3 className="text-2xl font-bold text-white gold-text-gradient uppercase tracking-tight">Nessuna spesa</h3>
          <p className="text-muted-foreground mt-3 font-medium">Non abbiamo trovato spese che corrispondono ai tuoi filtri.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExpenses.map(expense => {
            const vehicle = data.vehicles.find(v => v.id === expense.vehicleId);
            const isLegalExpense = ['assicurazione', 'bollo', 'revisione'].includes(expense.category);
            
            return (
              <div key={expense.id} className={cn(
                "luxury-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-primary/30 transition-all border-white/5",
                isLegalExpense && "border-l-4 border-l-primary/60"
              )}>
                <div className="flex items-center gap-5 min-w-0">
                  <div className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-all group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]",
                    categoryColors[expense.category],
                    "text-primary"
                  )}>
                    {categoryIcons[expense.category]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h3 className="text-lg font-extrabold text-white group-hover:text-primary transition-colors">
                        {categoryLabels[expense.category]}
                      </h3>
                      <span className="text-[10px] font-bold bg-white/5 text-white/60 px-3 py-1 rounded-lg uppercase tracking-widest border border-white/5">
                        {vehicle?.brand} {vehicle?.model}
                      </span>
                      {isLegalExpense && (
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-lg uppercase tracking-widest border border-primary/10">
                          Documento
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-medium text-muted-foreground truncate opacity-70">
                        {expense.description || "Nessuna descrizione fornita"}
                      </p>
                      <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                        {formatDate(expense.date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-white group-hover:text-primary transition-colors">{formatCurrency(expense.amount)}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Importo Totale</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setEditExpense(expense)}
                      className="h-11 w-11 rounded-xl bg-white/5 border-white/10 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all active:scale-[0.95]"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setDeleteConfirm(expense)}
                      className="h-11 w-11 rounded-xl bg-red-500/5 border-red-500/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-all active:scale-[0.95]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm || !!editExpense} onOpenChange={open => { if (!open) { setShowForm(false); setEditExpense(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-2xl border-primary/20 rounded-[32px] p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-extrabold text-white gold-text-gradient uppercase tracking-tight">
              {editExpense ? 'Modifica Spesa' : 'Nuova Spesa Premium'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              {editExpense ? 'Modifica i dettagli della spesa automotive' : 'Inserisci i dettagli del nuovo costo sostenuto'}
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm expense={editExpense} onComplete={() => { setShowForm(false); setEditExpense(null); }} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-black/95 backdrop-blur-2xl border-primary/20 rounded-[32px] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-extrabold text-white uppercase tracking-tight">Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              Sei sicuro di voler eliminare definitivamente questa spesa?<br />
              <span className="text-primary font-bold mt-2 block">{categoryLabels[deleteConfirm?.category || 'altro']} - {formatCurrency(deleteConfirm?.amount || 0)}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-xl font-bold bg-white/5 border-white/10 text-white hover:bg-white/10">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 border-0 shadow-lg shadow-red-500/20">Elimina Definitivamente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
