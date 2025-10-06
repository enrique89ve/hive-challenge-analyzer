import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Zap, CalendarDays, Play } from 'lucide-react';
import { subDays, subHours, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from '../types/hive';

interface DateRangeSelectorProps {
  readonly dateRange: DateRange;
  readonly onDateRangeChange: (dateRange: DateRange) => void;
  readonly disabled?: boolean;
}

// Formatear fecha en UTC sin depender de la zona horaria del navegador
const formatUTC = (date: Date, formatStr: string): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const year = date.getUTCFullYear();
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  // Formato: "MMM d, yyyy HH:mm 'UTC'"
  if (formatStr === "MMM d, yyyy HH:mm 'UTC'") {
    return `${month} ${day}, ${year} ${hours}:${minutes} UTC`;
  }

  return date.toISOString();
};

interface DatePreset {
  readonly label: string;
  readonly description: string;
  readonly getRange: () => DateRange;
  readonly icon: React.ReactNode;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateRange,
  onDateRangeChange,
  disabled = false
}) => {
  const [localDateRange, setLocalDateRange] = useState<DateRange>(dateRange);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalDateRange(dateRange);
    setHasChanges(false);
  }, [dateRange]);

  useEffect(() => {
    const hasLocalChanges =
      localDateRange.startDate.getTime() !== dateRange.startDate.getTime() ||
      localDateRange.endDate.getTime() !== dateRange.endDate.getTime();
    setHasChanges(hasLocalChanges);
  }, [localDateRange, dateRange]);

  const presets: DatePreset[] = [
    {
      label: "Últimas 24h",
      description: "Últimas 24 horas desde ahora",
      icon: <Clock className="w-3 h-3" />,
      getRange: () => {
        const now = new Date();
        return {
          startDate: subHours(now, 24),
          endDate: now
        };
      }
    },
    {
      label: "48 horas",
      description: "1 Oct 00:00 UTC → 3 Oct 00:00 UTC (48 horas exactas)",
      icon: <CalendarDays className="w-3 h-3" />,
      getRange: () => {
        // Octubre 1, 2025 a las 00:00:00 UTC
        const startDate = new Date(Date.UTC(2025, 9, 1, 0, 0, 0, 0)); // mes 9 = octubre (0-indexed)

        // Octubre 3, 2025 a las 00:00:00 UTC (48 horas después)
        const endDate = new Date(Date.UTC(2025, 9, 3, 0, 0, 0, 0));

        return {
          startDate,
          endDate
        };
      }
    },
    {
      label: "Últimos 3 días",
      description: "Últimos 3 días completos",
      icon: <CalendarDays className="w-3 h-3" />,
      getRange: () => {
        const now = new Date();
        return {
          startDate: startOfDay(subDays(now, 3)),
          endDate: endOfDay(now)
        };
      }
    },
    {
      label: "Última semana",
      description: "Últimos 7 días completos",
      icon: <Calendar className="w-3 h-3" />,
      getRange: () => {
        const now = new Date();
        return {
          startDate: startOfDay(subDays(now, 7)),
          endDate: endOfDay(now)
        };
      }
    },
    {
      label: "Hive Power Day",
      description: "Día 1 al 2 del mes actual (24 horas)",
      icon: <Zap className="w-3 h-3" />,
      getRange: () => {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth(); // 0-indexed (0 = enero, 9 = octubre)

        // Día 1 del mes actual a las 00:00:00 UTC
        const startDate = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0));

        // Día 2 del mes actual a las 00:00:00 UTC (24 horas después)
        const endDate = new Date(Date.UTC(currentYear, currentMonth, 2, 0, 0, 0, 0));

        return {
          startDate,
          endDate
        };
      }
    }
  ];

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    if (!value) {
      console.warn(`Valor vacío para ${field}`);
      return;
    }

    try {
      const date = new Date(value + ':00.000Z');

      if (isNaN(date.getTime())) {
        console.error(`Fecha inválida para ${field}:`, value);
        return;
      }

      const newRange = {
        ...localDateRange,
        [field]: date
      };

      if (field === 'startDate' && date >= localDateRange.endDate) {
        console.warn('La fecha de inicio debe ser anterior a la fecha de fin');
        return;
      }

      if (field === 'endDate' && date <= localDateRange.startDate) {
        console.warn('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }

      setLocalDateRange(newRange);
    } catch (error) {
      console.error(`Error procesando ${field}:`, error, value);
    }
  };

  const handlePresetSelect = (preset: DatePreset) => {
    const newRange = preset.getRange();
    setLocalDateRange(newRange);
  };

  const handleApplyChanges = () => {
    onDateRangeChange(localDateRange);
  };

  const formatDateForInput = (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      console.warn('Fecha inválida pasada a formatDateForInput:', date);
      return '';
    }
    try {
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

  const getDurationText = () => {
    try {
      // Formatear fechas en UTC sin usar zona horaria del navegador
      const start = formatUTC(localDateRange.startDate, "MMM d, yyyy HH:mm 'UTC'");
      const end = formatUTC(localDateRange.endDate, "MMM d, yyyy HH:mm 'UTC'");
      const diffMs = localDateRange.endDate.getTime() - localDateRange.startDate.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      let duration = '';
      if (diffDays > 0) {
        duration = `${diffDays}d ${diffHours % 24}h`;
      } else {
        duration = `${diffHours}h`;
      }

      console.log('📅 Rango UTC:', {
        start: localDateRange.startDate.toISOString(),
        end: localDateRange.endDate.toISOString(),
        duration: `${diffHours}h`
      });

      return `${start} → ${end} (${duration})`;
    } catch (error) {
      return 'Rango de fechas inválido';
    }
  };

  return (
    <div className="space-y-4 p-4 border border-terminal-green/20 bg-terminal-green/5 rounded">
      <div className="flex items-center gap-2 text-terminal-green font-mono text-sm">
        <Calendar className="w-4 h-4" />
        <span>Configuración de Rango de Fechas</span>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-terminal-green/70 font-mono">
          Rangos predefinidos
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetSelect(preset)}
              disabled={disabled}
              className="flex items-center gap-1 p-2 text-xs font-mono text-terminal-green/70 hover:text-terminal-green bg-terminal-bg border border-terminal-green/20 hover:border-terminal-green/40 rounded transition-colors disabled:opacity-50"
              title={preset.description}
            >
              {preset.icon}
              <span className="truncate">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs text-terminal-green/70 font-mono">
            Fecha inicio (UTC) - Permite fechas pasadas y futuras
          </label>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-terminal-green/50" />
            <input
              type="datetime-local"
              value={formatDateForInput(localDateRange.startDate)}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              disabled={disabled}
              className="flex-1 bg-terminal-bg border border-terminal-green/30 text-terminal-green font-mono text-xs px-2 py-1 rounded focus:border-terminal-green focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-terminal-green/70 font-mono">
            Fecha fin (UTC) - Permite fechas pasadas y futuras
          </label>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-terminal-green/50" />
            <input
              type="datetime-local"
              value={formatDateForInput(localDateRange.endDate)}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              disabled={disabled}
              className="flex-1 bg-terminal-bg border border-terminal-green/30 text-terminal-green font-mono text-xs px-2 py-1 rounded focus:border-terminal-green focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div className="text-xs text-terminal-green/50 font-mono">
        {getDurationText()}
      </div>

      {hasChanges && (
        <div className="flex items-center justify-between p-3 bg-terminal-green/10 border border-terminal-green/30 rounded">
          <div className="text-xs text-terminal-green/70 font-mono">
            Tienes cambios sin aplicar
          </div>
          <button
            onClick={handleApplyChanges}
            disabled={disabled}
            className="flex items-center gap-1 px-3 py-1 text-xs font-mono text-terminal-bg bg-terminal-green hover:bg-terminal-green/80 rounded transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3" />
            Aplicar Cambios
          </button>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;