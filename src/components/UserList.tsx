import React, { useState } from 'react';
import { User, CheckCircle, Image, Zap, X, AlertCircle, Bot } from 'lucide-react';
import type { ChallengeAnalysis } from '../types/hive';

interface UserListProps {
  readonly analysis: ChallengeAnalysis;
}

const UserList: React.FC<UserListProps> = ({ analysis }) => {
  const [showInvalid, setShowInvalid] = useState(true);
  const [showIgnored, setShowIgnored] = useState(false);

  if (analysis.totalComments === 0) {
    return (
      <div className="text-terminal-green/70 font-mono text-sm">
        No se encontraron comentarios para analizar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-terminal-green/5 rounded border border-terminal-green/20">
        <div className="text-center">
          <div className="text-lg font-mono text-terminal-green">{analysis.totalComments}</div>
          <div className="text-xs text-terminal-green/70">Total comentarios</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-mono text-green-400">{analysis.validUsers.length}</div>
          <div className="text-xs text-terminal-green/70">Usuarios válidos</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-mono text-red-400">{analysis.invalidUsers.length}</div>
          <div className="text-xs text-terminal-green/70">No cumplen</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-mono text-yellow-400">{analysis.ignoredUsers.length}</div>
          <div className="text-xs text-terminal-green/70">Ignorados</div>
        </div>
      </div>

      {/* Controles de visualización */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowInvalid(!showInvalid)}
          className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${showInvalid
            ? 'bg-red-400/20 border-red-400/50 text-red-300'
            : 'bg-terminal-green/5 border-terminal-green/20 text-terminal-green/70'
            }`}
        >
          {showInvalid ? 'Ocultar' : 'Mostrar'} usuarios que no cumplen
        </button>
        <button
          onClick={() => setShowIgnored(!showIgnored)}
          className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${showIgnored
            ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300'
            : 'bg-terminal-green/5 border-terminal-green/20 text-terminal-green/70'
            }`}
        >
          {showIgnored ? 'Ocultar' : 'Mostrar'} cuentas ignoradas
        </button>
      </div>

      {/* Usuarios válidos */}
      {analysis.validUsers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-400 font-mono text-sm border-b border-green-400/20 pb-2">
            <CheckCircle className="w-4 h-4" />
            <span>✅ Usuarios que cumplieron el reto ({analysis.validUsers.length})</span>
          </div>

          <div className="space-y-2">
            {analysis.validUsers.map((user, index) => (
              <div
                key={user.name}
                className="flex items-center gap-3 p-3 bg-green-400/5 rounded border border-green-400/20 hover:bg-green-400/10 transition-colors"
              >
                <User className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-green-400">
                    @{user.name}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1">
                      <Image className="w-3 h-3 text-green-400/70" />
                      <span className="text-xs text-green-400/70 font-mono">
                        {user.images.length} imagen{user.images.length !== 1 ? 'es' : ''}
                      </span>
                    </div>
                    {user.powerUpDate && (
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-green-400/70" />
                        <span className="text-xs text-green-400/70 font-mono">
                          Power Up: {user.powerUpDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs font-mono text-green-400/50">
                  #{String(index + 1).padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usuarios inválidos */}
      {showInvalid && analysis.invalidUsers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-mono text-sm border-b border-red-400/20 pb-2">
            <X className="w-4 h-4" />
            <span>❌ Usuarios que NO cumplieron ({analysis.invalidUsers.length})</span>
          </div>

          <div className="space-y-2">
            {analysis.invalidUsers.map((user, index) => (
              <div
                key={user.name}
                className="flex items-center gap-3 p-3 bg-red-400/5 rounded border border-red-400/20 hover:bg-red-400/10 transition-colors"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-red-400">
                    @{user.name}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {user.hasImages && (
                      <div className="flex items-center gap-1">
                        <Image className="w-3 h-3 text-red-400/70" />
                        <span className="text-xs text-red-400/70 font-mono">
                          {user.images.length} imagen{user.images.length !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-red-400/70 font-mono">
                      {user.reason}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-mono text-red-400/50">
                  #{String(index + 1).padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cuentas ignoradas */}
      {showIgnored && analysis.ignoredUsers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-yellow-400 font-mono text-sm border-b border-yellow-400/20 pb-2">
            <Bot className="w-4 h-4" />
            <span>🤖 Cuentas ignoradas (bots/sistema) ({analysis.ignoredUsers.length})</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {analysis.ignoredUsers.map((username) => (
              <div
                key={username}
                className="flex items-center gap-2 p-2 bg-yellow-400/5 rounded border border-yellow-400/20"
              >
                <Bot className="w-3 h-3 text-yellow-400/70 flex-shrink-0" />
                <span className="text-xs font-mono text-yellow-400/70">@{username}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;