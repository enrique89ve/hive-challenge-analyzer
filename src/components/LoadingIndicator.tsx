import React from 'react';

interface LoadingIndicatorProps {
  readonly current?: number;
  readonly total?: number;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ current, total }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="animate-spin w-4 h-4 border border-terminal-green border-t-transparent rounded-full"></div>
        <span className="font-mono text-sm text-terminal-green">
          Analizando datos de Hive...
        </span>
      </div>
      {current && total && (
        <div className="text-xs text-terminal-green/70 font-mono">
          Procesando comentario {current} de {total} ({Math.round((current / total) * 100)}%)
        </div>
      )}
    </div>
  );
};

export default LoadingIndicator;