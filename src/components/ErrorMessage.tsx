import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  readonly message: string;
  readonly onRetry: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="space-y-3 p-4 border border-red-500/30 bg-red-500/5 rounded">
      <div className="flex items-center gap-2 text-red-400">
        <AlertCircle className="w-4 h-4" />
        <span className="font-mono text-sm">Error</span>
      </div>
      <div className="text-red-400/80 font-mono text-xs leading-relaxed">
        {message}
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 text-terminal-green hover:text-terminal-green/80 transition-colors font-mono text-xs"
      >
        <RefreshCw className="w-3 h-3" />
        Reintentar
      </button>
    </div>
  );
};

export default ErrorMessage;