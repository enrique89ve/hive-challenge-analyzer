import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from '../types/hive';

interface DateRangeSelectorProps {
  readonly dateRange: DateRange;
  readonly onDateRangeChange: (dateRange: DateRange) => void;
  readonly disabled?: boolean;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateRange,
  onDateRangeChange,
  disabled = false
}) => {
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    if (!value) {
      console.warn(`Valor vacío para ${field}`);
      return;
    }

    try {
      // Crear fecha en UTC para evitar conversiones de zona horaria
      const date = new Date(value + ':00.000Z'); // Agregar segundos y UTC marker

      if (isNaN(date.getTime())) {
        console.error(`Fecha inválida para ${field}:`, value);
        return;
      }

      onDateRangeChange({
        ...dateRange,
        [field]: date
      });
    } catch (error) {
      console.error(`Error procesando ${field}:`, error, value);
    }
  };

  const formatDateForInput = (date: Date) => {
    // Validar que la fecha sea válida antes de formatear
    if (!date || isNaN(date.getTime())) {
      console.warn('Fecha inválida pasada a formatDateForInput:', date);
      return '';
    }
    try {
      // Asegurar que el formato sea siempre UTC
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formateando fecha:', error, date);
      return '';
    }
  };

  return (
    <div className="space-y-3 p-4 border border-terminal-green/20 bg-terminal-green/5 rounded">
      <div className="flex items-center gap-2 text-terminal-green font-mono text-sm">
        <Calendar className="w-4 h-4" />
        <span>Rango de fechas para Power Up</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs text-terminal-green/70 font-mono">
            Fecha inicio (UTC)
          </label>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-terminal-green/50" />
            <input
              type="datetime-local"
              value={formatDateForInput(dateRange.startDate)}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              disabled={disabled}
              className="bg-terminal-bg border border-terminal-green/30 text-terminal-green font-mono text-xs px-2 py-1 rounded focus:border-terminal-green focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-terminal-green/70 font-mono">
            Fecha fin (UTC)
          </label>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-terminal-green/50" />
            <input
              type="datetime-local"
              value={formatDateForInput(dateRange.endDate)}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              disabled={disabled}
              className="bg-terminal-bg border border-terminal-green/30 text-terminal-green font-mono text-xs px-2 py-1 rounded focus:border-terminal-green focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div className="text-xs text-terminal-green/50 font-mono">
        Duración: {format(dateRange.startDate, "MMM d, yyyy HH:mm")} - {format(dateRange.endDate, "MMM d, yyyy HH:mm")} UTC
      </div>
    </div>
  );
};

export default DateRangeSelector;