import { VehicleManagerData, Vehicle, Maintenance, Expense } from '@/types/vehicle';
import { formatDate, formatCurrency, formatKm } from './dates';

// Export JSON
export function downloadJSON(data: VehicleManagerData, filename: string = 'vehicle-manager-backup') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${formatDate(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export PDF (usando canvas per generare)
export function generateVehiclePDF(vehicle: Vehicle, maintenances: Maintenance[], expenses: Expense[]) {
  const content = generatePDFContent(vehicle, maintenances, expenses);
  
  // Crea una finestra popup per la stampa
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Report ${vehicle.brand} ${vehicle.model}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .info-item { padding: 8px; background: #f9fafb; border-radius: 4px; }
        .info-label { font-weight: bold; color: #6b7280; font-size: 12px; }
        .info-value { font-size: 14px; margin-top: 4px; }
        .total { font-size: 18px; font-weight: bold; color: #1e40af; margin-top: 20px; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      ${content}
      <script>window.onload = () => { window.print(); }</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function generatePDFContent(vehicle: Vehicle, maintenances: Maintenance[], expenses: Expense[]): string {
  const totalMaintenance = maintenances.reduce((sum, m) => sum + m.cost, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const grandTotal = totalMaintenance + totalExpenses;

  return `
    <h1>🚗 Report Veicolo</h1>
    
    <h2>Informazioni Veicolo</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Marca / Modello</div>
        <div class="info-value">${vehicle.brand} ${vehicle.model} ${vehicle.version}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Anno</div>
        <div class="info-value">${vehicle.year}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Targa</div>
        <div class="info-value">${vehicle.plate}</div>
      </div>
      <div class="info-item">
        <div class="info-label">VIN</div>
        <div class="info-value">${vehicle.vin}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Chilometraggio</div>
        <div class="info-value">${formatKm(vehicle.currentKm)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Alimentazione</div>
        <div class="info-value">${vehicle.fuel}</div>
      </div>
    </div>

    <h2>Manutenzioni (${maintenances.length})</h2>
    ${maintenances.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Km</th>
            <th>Costo</th>
          </tr>
        </thead>
        <tbody>
          ${maintenances.map(m => `
            <tr>
              <td>${formatDate(m.date)}</td>
              <td>${m.type}</td>
              <td>${formatKm(m.km)}</td>
              <td>${formatCurrency(m.cost)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p><strong>Totale manutenzioni: ${formatCurrency(totalMaintenance)}</strong></p>
    ` : '<p>Nessuna manutenzione registrata.</p>'}

    <h2>Spese (${expenses.length})</h2>
    ${expenses.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Categoria</th>
            <th>Descrizione</th>
            <th>Importo</th>
          </tr>
        </thead>
        <tbody>
          ${expenses.map(e => `
            <tr>
              <td>${formatDate(e.date)}</td>
              <td>${e.category}</td>
              <td>${e.description}</td>
              <td>${formatCurrency(e.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p><strong>Totale spese: ${formatCurrency(totalExpenses)}</strong></p>
    ` : '<p>Nessuna spesa registrata.</p>'}

    <div class="total">
      💰 TOTALE COMPLESSIVO: ${formatCurrency(grandTotal)}
    </div>

    <p style="margin-top: 40px; color: #9ca3af; font-size: 12px;">
      Report generato il ${formatDate(new Date(), 'dd/MM/yyyy HH:mm')} - VehicleManager Pro
    </p>
  `;
}
