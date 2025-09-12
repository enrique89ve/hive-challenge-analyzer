import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { getChallengeParticipants } from './services/hiveService';
import TerminalHeader from './components/TerminalHeader';
import DateRangeSelector from './components/DateRangeSelector';
import LoadingIndicator from './components/LoadingIndicator';
import UserList from './components/UserList';
import ErrorMessage from './components/ErrorMessage';
import StatusBar from './components/StatusBar';
import type { ChallengeResult, DateRange } from './types/hive';

function App() {
  // Función para crear fechas válidas con fallback
  const createValidDateRange = (): DateRange => {
    try {
      const start = parseISO("2025-09-01T00:00:00Z");
      const end = parseISO("2025-09-03T23:59:59Z");

      // Verificar que las fechas sean válidas
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Fechas por defecto inválidas');
      }

      return { startDate: start, endDate: end };
    } catch (error) {
      console.error('Error creando fechas por defecto:', error);
      // Fallback a fechas válidas
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), 3, 23, 59, 59)
      };
    }
  };

  const [result, setResult] = useState<ChallengeResult>({
    analysis: {
      validUsers: [],
      invalidUsers: [],
      ignoredUsers: [],
      totalComments: 0
    },
    status: 'idle'
  });
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(createValidDateRange());
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = async () => {
    setResult(prev => ({ ...prev, status: 'loading', error: undefined }));
    setProgress(null);

    try {
      const analysis = await getChallengeParticipants(
        "hiveblocks-es",
        "hive-power-day-150-hbd-en-premios-por-hacer-power-up-48h-para-participar",
        dateRange,
        (current, total) => {
          setProgress({ current, total });
        }
      );

      setResult({
        analysis,
        status: 'success'
      });
      setProgress(null);
    } catch (error) {
      setResult(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
      setProgress(null);
    }
  };

  useEffect(() => {
    if (autoRefresh) {
      fetchData();
    }
  }, [dateRange, autoRefresh]);

  useEffect(() => {
    setAutoRefresh(true);
    fetchData();
  }, []);

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  const getStatusText = () => {
    switch (result.status) {
      case 'loading': return 'EJECUTANDO';
      case 'success': return 'COMPLETADO';
      case 'error': return 'ERROR';
      default: return 'ESPERANDO';
    }
  };

  const getCurrentTimestamp = () => {
    return new Date().toLocaleString('es-ES', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' UTC';
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-green font-mono p-8">
      <div className="max-w-4xl mx-auto">
        <TerminalHeader />

        <div className="space-y-6">
          <DateRangeSelector
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            disabled={result.status === 'loading'}
            onRefresh={fetchData}
            isLoading={result.status === 'loading'}
          />

          <div className="space-y-2">
            <div className="text-sm text-terminal-green/70">
              $ ./analyze-hive-challenge.sh --author=hiveblocks-es --permlink=hive-power-day-150-hbd-en-premios-por-hacer-power-up-48h-para-participar
            </div>
            <div className="text-xs text-terminal-green/50">
              Buscando usuarios que comentaron con imagen Y hicieron power up en el rango seleccionado...
            </div>
          </div>

          <div className="min-h-[300px]">
            {result.status === 'loading' && (
              <LoadingIndicator current={progress?.current} total={progress?.total} />
            )}

            {result.status === 'error' && result.error && (
              <ErrorMessage message={result.error} onRetry={fetchData} />
            )}

            {result.status === 'success' && (
              <UserList analysis={result.analysis} />
            )}
          </div>
        </div>

        <StatusBar
          status={getStatusText()}
          timestamp={getCurrentTimestamp()}
        />
      </div>
    </div>
  );
}

export default App;