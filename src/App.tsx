import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { RefreshCw, Play, Calendar } from 'lucide-react';
import { getChallengeParticipants } from './services/hiveService';
import TerminalHeader from './components/TerminalHeader';
import DateRangeSelector from './components/DateRangeSelector';
import PostUrlInput from './components/PostUrlInput';
import FilterOptionsComponent from './components/FilterOptions';
import LoadingIndicator from './components/LoadingIndicator';
import UserList from './components/UserList';
import ErrorMessage from './components/ErrorMessage';
import StatusBar from './components/StatusBar';
import type { ChallengeResult, DateRange, PostInfo, FilterOptions } from './types/hive';

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
  const [postInfo, setPostInfo] = useState<PostInfo>({
    author: "",
    permlink: ""
  });
  const [filters, setFilters] = useState<FilterOptions>({
    minPowerUp: 10
  });
  const [canAnalyze, setCanAnalyze] = useState<boolean>(false);

  const fetchData = async () => {
    // Validar que tenemos author y permlink antes de ejecutar
    if (!postInfo.author || !postInfo.permlink) {
      setResult(prev => ({
        ...prev,
        status: 'error',
        error: 'Debe ingresar una URL de post válida antes de analizar'
      }));
      return;
    }

    setResult(prev => ({ ...prev, status: 'loading', error: undefined }));
    setProgress(null);

    try {
      const analysis = await getChallengeParticipants(
        postInfo.author,
        postInfo.permlink,
        dateRange,
        (current, total) => {
          setProgress({ current, total });
        },
        filters.minPowerUp
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

  // Verificar si podemos analizar (tenemos author y permlink válidos)
  useEffect(() => {
    const isValid = postInfo.author.trim() !== "" && postInfo.permlink.trim() !== "";
    console.log('🔍 Validando postInfo:', { author: postInfo.author, permlink: postInfo.permlink, isValid });
    setCanAnalyze(isValid);
  }, [postInfo]);

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  const handlePostChange = (newPostInfo: PostInfo) => {
    setPostInfo(newPostInfo);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
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
          <PostUrlInput
            onPostChange={handlePostChange}
            disabled={result.status === 'loading'}
            initialAuthor={postInfo.author}
            initialPermlink={postInfo.permlink}
          />

          <DateRangeSelector
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            disabled={result.status === 'loading'}
          />

          <FilterOptionsComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            disabled={result.status === 'loading'}
          />

          {/* Botón de Analizar */}
          <div className="flex justify-center">
            <button
              onClick={fetchData}
              disabled={!canAnalyze || result.status === 'loading'}
              className={`
                px-6 py-3 rounded font-bold text-lg transition-all duration-200
                ${canAnalyze && result.status !== 'loading'
                  ? 'bg-terminal-green text-black hover:bg-terminal-green/80 hover:shadow-lg hover:shadow-terminal-green/50'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                }
              `}
            >
              {result.status === 'loading' ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Analizando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Analizar Challenge
                </span>
              )}
            </button>
          </div>

          {postInfo.author && postInfo.permlink && (
            <div className="space-y-2">
              <div className="text-sm text-terminal-green/70">
                $ ./analyze-hive-challenge.sh --author={postInfo.author} --permlink={postInfo.permlink}
              </div>
              <div className="text-xs text-terminal-green/50">
                Buscando usuarios que comentaron con imagen Y hicieron power up en el rango seleccionado...
              </div>
            </div>
          )}

          <div className="min-h-[300px]">
            {result.status === 'idle' && !postInfo.author && (
              <div className="text-center text-terminal-green/50 py-16">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">Configura tu análisis</p>
                <p className="text-sm">Ingresa la URL del post y selecciona el rango de fechas</p>
              </div>
            )}

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