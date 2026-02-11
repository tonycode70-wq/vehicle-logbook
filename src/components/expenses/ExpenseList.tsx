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
  carburante: 'bg-primary/10',
  parcheggio: 'bg-accent',
  pedaggi: 'bg-accent',
  lavaggio: 'bg-accent',
  accessori: 'bg-accent',
  assicurazione: 'bg-success/10',
  bollo: 'bg-warning/10',
  revisione: 'bg-primary/10',
  tasse: 'bg-warning/10',
  pneumatici: 'bg-accent',
  altro: 'bg-muted',
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

  // Group expenses by month for better organization
  const expensesByMonth = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    filteredExpenses.forEach(expense => {
      const d = new Date(expense.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(expense);
    });
    return groups;
  }, [filteredExpenses]);

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteExpense(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Spese</h1>
          <p className="text-muted-foreground">Tracciamento spese veicoli</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={data.vehicles.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Spesa
        </Button>
      </div>

      {/* Filtri */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cerca spese..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tutti i veicoli" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i veicoli</SelectItem>
                {data.vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.brand} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Totale */}
      {filteredExpenses.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Totale spese filtrate</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      {data.vehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">Nessun veicolo registrato</p>
            <p className="text-muted-foreground">
              Aggiungi prima un veicolo per registrare spese
            </p>
          </CardContent>
        </Card>
      ) : filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">Nessuna spesa trovata</p>
            <p className="text-muted-foreground">
              {data.expenses.length === 0 
                ? "Registra la tua prima spesa" 
                : "Prova a modificare i filtri di ricerca"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map(expense => {
            const vehicle = data.vehicles.find(v => v.id === expense.vehicleId);
            const isLegalExpense = ['assicurazione', 'bollo', 'revisione'].includes(expense.category);
            
            return (
              <Card key={expense.id} className={cn(isLegalExpense && "border-l-4 border-l-primary")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        categoryColors[expense.category]
                      )}>
                        {categoryIcons[expense.category]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">
                            {categoryLabels[expense.category]}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {vehicle?.brand} {vehicle?.model}
                          </Badge>
                          {isLegalExpense && (
                            <Badge variant="secondary" className="text-xs">
                              Legale
                            </Badge>
                          )}
                        </div>
                        {expense.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {expense.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(expense.date)}
                          </span>
                          {expense.km > 0 && (
                            <span>{formatKm(expense.km)}</span>
                          )}
                          {expense.validityEnd && (
                            <span className="text-primary">
                              Scade: {formatDate(expense.validityEnd)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold whitespace-nowrap">
                        {formatCurrency(expense.amount)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditExpense(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(expense)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm || !!editExpense} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditExpense(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editExpense ? 'Modifica Spesa' : 'Nuova Spesa'}
            </DialogTitle>
            <DialogDescription>
              {editExpense 
                ? 'Modifica i dati della spesa' 
                : 'Registra una nuova spesa'}
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm 
            expense={editExpense} 
            onComplete={() => {
              setShowForm(false);
              setEditExpense(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa spesa?
              <br />
              <strong>{categoryLabels[deleteConfirm?.category as ExpenseCategory]}</strong> - {formatCurrency(deleteConfirm?.amount || 0)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
