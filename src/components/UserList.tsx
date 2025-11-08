import React, { useState, useEffect } from 'react';
import { User, CheckCircle, Image, Zap, X, AlertCircle, Bot, Copy, Check, ChevronDown, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import type { ChallengeAnalysis } from '../types/hive';

interface UserListProps {
  readonly analysis: ChallengeAnalysis;
}

const UserList: React.FC<UserListProps> = ({ analysis }) => {
  const [showInvalid, setShowInvalid] = useState(true);
  const [showIgnored, setShowIgnored] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());
  const [expandedPowerUps, setExpandedPowerUps] = useState<Set<string>>(new Set());

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowCopyMenu(false);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowCopyMenu(false);
    }
  };

  // Función para obtener el valor numérico del HP para ordenamiento
  const getHivePowerValue = (amount: string | undefined): number => {
    if (!amount || amount === 'N/A') return 0;

    try {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount)) return 0;
      return numericAmount; // Ya viene dividido desde el servicio
    } catch (error) {
      return 0;
    }
  };

  // Función para alternar las imágenes expandidas
  const toggleExpandedImages = (userName: string) => {
    setExpandedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userName)) {
        newSet.delete(userName);
      } else {
        newSet.add(userName);
      }
      return newSet;
    });
  };

  // Función para alternar los detalles de Power Up
  const toggleExpandedPowerUps = (userName: string) => {
    setExpandedPowerUps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userName)) {
        newSet.delete(userName);
      } else {
        newSet.add(userName);
      }
      return newSet;
    });
  };

  // Componente para mostrar vista previa de imágenes
  const ImagePreview: React.FC<{ images: string[], userName: string }> = ({ images, userName }) => {
    const isExpanded = expandedImages.has(userName);

    if (images.length === 0) return null;

    return (
      <div className="mt-2">
        <button
          onClick={() => toggleExpandedImages(userName)}
          className="flex items-center gap-1 text-xs text-green-400/70 hover:text-green-400 transition-colors"
        >
          {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          <span>{isExpanded ? 'Ocultar' : 'Ver'} imágenes</span>
        </button>

        {isExpanded && (
          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Imagen ${index + 1} de @${userName}`}
                  className="w-full h-20 object-cover rounded border border-green-400/20 hover:border-green-400/40 transition-colors"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-20 items-center justify-center bg-red-400/10 border border-red-400/20 rounded text-xs text-red-400/70">
                  Error al cargar
                </div>
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                  title="Ver imagen completa"
                >
                  <ExternalLink className="w-4 h-4 text-white" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Función para alternar entre los estados de ordenamiento
  const handleSortToggle = () => {
    if (sortOrder === 'none') {
      setSortOrder('desc'); // Mayor a menor
    } else if (sortOrder === 'desc') {
      setSortOrder('asc'); // Menor a mayor
    } else {
      setSortOrder('none'); // Sin ordenar
    }
  };

  // Función para obtener los usuarios ordenados
  const getSortedValidUsers = () => {
    if (sortOrder === 'none') {
      return analysis.validUsers;
    }

    const sorted = [...analysis.validUsers].sort((a, b) => {
      // Usar totalPowerUp si está disponible, sino usar powerUpAmount
      const aValue = a.totalPowerUp ? parseFloat(a.totalPowerUp) : getHivePowerValue(a.powerUpAmount);
      const bValue = b.totalPowerUp ? parseFloat(b.totalPowerUp) : getHivePowerValue(b.powerUpAmount);

      if (sortOrder === 'desc') {
        return bValue - aValue; // Mayor a menor
      } else {
        return aValue - bValue; // Menor a mayor
      }
    });

    return sorted;
  };

  const sortedValidUsers = getSortedValidUsers();

  const formatHivePower = (amount: string | undefined): string => {
    if (!amount || amount === 'N/A') return 'N/A';

    try {
      // El monto ya viene dividido entre 1000 desde el servicio
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount)) return 'N/A';

      // Formatear con 3 decimales y agregar HP
      return `${numericAmount.toFixed(3)} HP`;
    } catch (error) {
      console.error('Error formateando Hive Power:', error);
      return 'N/A';
    }
  };

  const handleCopyValidUsers = async () => {
    const usersList = sortedValidUsers.map(user => `@${user.name}`).join('\n');
    await copyToClipboard(usersList);
  };

  const handleCopyAsCSV = async () => {
    const csvHeader = 'Usuario,Imágenes,Power Up,Hive Power,Transacción';
    const csvData = sortedValidUsers.map(user =>
      `@${user.name},${user.images.length},${user.powerUpDate || 'N/A'},${formatHivePower(user.powerUpAmount)},${user.powerUpTxId ? `https://hivehub.dev/tx/${user.powerUpTxId}` : 'N/A'}`
    ).join('\n');
    await copyToClipboard(`${csvHeader}\n${csvData}`);
  };

  const handleCopyAsMarkdown = async () => {
    const markdown = sortedValidUsers.map((user, index) =>
      `${index + 1}. @${user.name} (${user.images.length} imagen${user.images.length !== 1 ? 'es' : ''}${user.powerUpDate ? `, Power Up: ${user.powerUpDate}` : ''}${user.powerUpAmount ? `, ${formatHivePower(user.powerUpAmount)}` : ''}${user.powerUpTxId ? ` - [Ver TX](https://hivehub.dev/tx/${user.powerUpTxId})` : ''})`
    ).join('\n');
    await copyToClipboard(markdown);
  };

  const handleCopyAsJSON = async () => {
    const jsonData = JSON.stringify(sortedValidUsers.map(user => ({
      username: user.name,
      images: user.images.length,
      powerUpDate: user.powerUpDate || null,
      powerUpAmount: user.powerUpAmount || null,
      powerUpAmountFormatted: formatHivePower(user.powerUpAmount),
      powerUpTxId: user.powerUpTxId || null,
      transactionUrl: user.powerUpTxId ? `https://hivehub.dev/tx/${user.powerUpTxId}` : null
    })), null, 2);
    await copyToClipboard(jsonData);
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (showCopyMenu) {
        setShowCopyMenu(false);
      }
    };

    if (showCopyMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCopyMenu]);

  if (analysis.totalComments === 0) {
    return (
      <div className="text-terminal-green/70 font-mono text-sm">
        No se encontraron comentarios para analizar.
      </div>
    );
  }

  // Calcular total de Hive Power acumulado
  const calculateTotalHivePower = (): string => {
    const total = analysis.validUsers.reduce((sum, user) => {
      if (user.totalPowerUp) {
        return sum + parseFloat(user.totalPowerUp);
      } else if (user.powerUpAmount) {
        return sum + getHivePowerValue(user.powerUpAmount);
      }
      return sum;
    }, 0);
    return total.toFixed(3);
  };

  const totalHP = calculateTotalHivePower();

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-terminal-green/5 rounded border border-terminal-green/20">
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
        <div className="text-center bg-white/5 rounded px-2">
          <div className="text-lg font-mono text-green-400 font-bold">{totalHP} HP</div>
          <div className="text-xs text-terminal-green/70">Total HP</div>
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
          <div className="flex items-center justify-between border-b border-green-400/20 pb-2">
            <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>✅ Usuarios que cumplieron el reto ({analysis.validUsers.length})</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Bot?n de ordenamiento por HP */}
              <button
                onClick={handleSortToggle}
                className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-yellow-400/70 hover:text-yellow-400 bg-yellow-400/5 hover:bg-yellow-400/10 border border-yellow-400/20 hover:border-yellow-400/40 rounded transition-colors"
                title={`Ordenar por HP: ${sortOrder === 'none' ? 'Sin ordenar' : sortOrder === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}`}
              >
                {sortOrder === 'none' && (
                  <>
                    <ArrowUpDown className="w-3 h-3" />
                    <span>HP</span>
                  </>
                )}
                {sortOrder === 'desc' && (
                  <>
                    <ArrowDown className="w-3 h-3" />
                    <span>HP ?</span>
                  </>
                )}
                {sortOrder === 'asc' && (
                  <>
                    <ArrowUp className="w-3 h-3" />
                    <span>HP ?</span>
                  </>
                )}
              </button>

              {/* Botones de copia */}
              <div className="relative">
                <div className="flex items-center">
                  <button
                    onClick={handleCopyValidUsers}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-green-400/70 hover:text-green-400 bg-green-400/5 hover:bg-green-400/10 border border-green-400/20 hover:border-green-400/40 rounded-l transition-colors"
                    title="Copiar lista de usuarios válidos"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCopyMenu(!showCopyMenu)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-green-400/70 hover:text-green-400 bg-green-400/5 hover:bg-green-400/10 border border-green-400/20 hover:border-green-400/40 border-l-0 rounded-r transition-colors"
                    title="Más opciones de copia"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                {showCopyMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-green-400/20 rounded shadow-lg z-10 min-w-[160px]">
                    <button
                      onClick={handleCopyAsMarkdown}
                      className="w-full text-left px-3 py-2 text-xs font-mono text-green-400/70 hover:text-green-400 hover:bg-green-400/5 transition-colors"
                    >
                      📝 Formato Markdown
                    </button>
                    <button
                      onClick={handleCopyAsCSV}
                      className="w-full text-left px-3 py-2 text-xs font-mono text-green-400/70 hover:text-green-400 hover:bg-green-400/5 transition-colors"
                    >
                      📊 Formato CSV
                    </button>
                    <button
                      onClick={handleCopyAsJSON}
                      className="w-full text-left px-3 py-2 text-xs font-mono text-green-400/70 hover:text-green-400 hover:bg-green-400/5 transition-colors border-t border-green-400/10"
                    >
                      💾 Formato JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {sortedValidUsers.map((user, index) => (
              <div
                key={user.name}
                className="p-3 bg-green-400/5 rounded border border-green-400/20 hover:bg-green-400/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-sm text-green-400">
                        @{user.name}
                      </div>
                      {user.commentCount && user.commentCount > 1 && (
                        <span className="text-xs text-green-400/50 font-mono bg-green-400/10 px-1.5 py-0.5 rounded">
                          {user.commentCount} comentarios
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <Image className="w-3 h-3 text-green-400/70" />
                        <span className="text-xs text-green-400/70 font-mono">
                          {user.images.length} imagen{user.images.length !== 1 ? 'es' : ''}
                        </span>
                      </div>
                      {user.powerUpDate && (
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded">
                              <Zap className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-green-400 font-mono font-semibold">
                                {user.totalPowerUp ? `Total: ${user.totalPowerUp} HP` : `${formatHivePower(user.powerUpAmount)}`}
                              </span>
                            </div>
                            {user.powerUpTransactions && user.powerUpTransactions.length > 1 && (
                              <button
                                onClick={() => toggleExpandedPowerUps(user.name)}
                                className="flex items-center gap-1 text-xs text-green-400/70 hover:text-green-400 transition-colors"
                              >
                                <ChevronDown className={`w-3 h-3 transition-transform ${expandedPowerUps.has(user.name) ? 'rotate-180' : ''}`} />
                                <span>{user.powerUpTransactions.length} transacciones</span>
                              </button>
                            )}
                          </div>

                          {/* Detalles expandidos de Power Ups */}
                          {expandedPowerUps.has(user.name) && user.powerUpTransactions && (
                            <div className="mt-2 space-y-1 pl-4 border-l-2 border-green-400/20">
                              {user.powerUpTransactions.map((tx, idx) => (
                                <div key={tx.txId} className="flex items-center gap-2 text-xs">
                                  <span className="text-green-400/50 font-mono">{idx + 1}.</span>
                                  <span className="text-green-400/70 font-mono">{tx.date}</span>
                                  <span className="text-yellow-400 font-mono font-bold">{tx.amount} HP</span>
                                  <a
                                    href={`https://hivehub.dev/tx/${tx.txId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-400/70 hover:text-green-400 transition-colors"
                                    title="Ver transacción en HiveHub"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {user.powerUpAmount && !user.totalPowerUp && (
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-yellow-400 font-mono font-bold">
                            {formatHivePower(user.powerUpAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-mono text-green-400/50">
                    #{String(index + 1).padStart(2, '0')}
                  </div>
                </div>
                <ImagePreview images={user.images} userName={user.name} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usuarios inválidos */}
      {
        showInvalid && analysis.invalidUsers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-mono text-sm border-b border-red-400/20 pb-2">
              <X className="w-4 h-4" />
              <span>❌ Usuarios que NO cumplieron ({analysis.invalidUsers.length})</span>
            </div>

            <div className="space-y-2">
              {analysis.invalidUsers.map((user, index) => (
                <div
                  key={user.name}
                  className="p-3 bg-red-400/5 rounded border border-red-400/20 hover:bg-red-400/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm text-red-400">
                          @{user.name}
                        </div>
                        {user.commentCount && user.commentCount > 1 && (
                          <span className="text-xs text-red-400/50 font-mono bg-red-400/10 px-1.5 py-0.5 rounded">
                            {user.commentCount} comentarios
                          </span>
                        )}
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
                  {user.hasImages && (
                    <ImagePreview images={user.images} userName={user.name} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* Cuentas ignoradas */}
      {
        showIgnored && analysis.ignoredUsers.length > 0 && (
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
        )
      }
    </div>
  );
};

export default UserList;
