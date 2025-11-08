import { useState } from 'react';
import { Filter, Image, ImageOff } from 'lucide-react';
import type { FilterOptions } from '../types/hive';

interface FilterOptionsProps {
    readonly filters: FilterOptions;
    readonly onFiltersChange: (filters: FilterOptions) => void;
    readonly disabled?: boolean;
}

export default function FilterOptionsComponent({
    filters,
    onFiltersChange,
    disabled = false
}: FilterOptionsProps) {
    const [localMinPowerUp, setLocalMinPowerUp] = useState<string>(filters.minPowerUp.toString());

    const handleMinPowerUpChange = (value: string): void => {
        setLocalMinPowerUp(value);

        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
            onFiltersChange({
                ...filters,
                minPowerUp: numValue
            });
        }
    };

    const handleRequireImagesChange = (value: boolean): void => {
        onFiltersChange({
            ...filters,
            requireImages: value
        });
    };

    return (
        <div className="space-y-4 border border-terminal-green/30 rounded p-4 bg-terminal-bg/50">
            <div className="flex items-center gap-2 text-terminal-green text-sm">
                <Filter className="w-4 h-4" />
                <span className="text-terminal-green/70">$</span> ./configure-filters.sh
            </div>

            <div className="space-y-2">
                <label htmlFor="min-powerup" className="block text-sm text-terminal-green/90">
                    Power Up Mínimo (HIVE):
                </label>
                <div className="flex items-center gap-3">
                    <input
                        id="min-powerup"
                        type="number"
                        min="0"
                        step="0.001"
                        value={localMinPowerUp}
                        onChange={(e) => handleMinPowerUpChange(e.target.value)}
                        disabled={disabled}
                        className="flex-1 bg-black/30 border border-terminal-green/30 rounded px-3 py-2 text-terminal-green placeholder-terminal-green/30 focus:outline-none focus:border-terminal-green/70 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                        placeholder="10.000"
                    />
                    <span className="text-terminal-green/50 text-sm font-mono">HIVE</span>
                </div>
                <div className="text-xs text-terminal-green/40 italic">
                    💡 Solo se mostrarán usuarios con Power Up mayor o igual a este valor
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={() => handleMinPowerUpChange('10')}
                    disabled={disabled}
                    className="px-3 py-1 text-xs font-mono text-terminal-green/70 hover:text-terminal-green bg-terminal-bg border border-terminal-green/20 hover:border-terminal-green/40 rounded transition-colors disabled:opacity-50"
                >
                    10 HIVE
                </button>
                <button
                    onClick={() => handleMinPowerUpChange('50')}
                    disabled={disabled}
                    className="px-3 py-1 text-xs font-mono text-terminal-green/70 hover:text-terminal-green bg-terminal-bg border border-terminal-green/20 hover:border-terminal-green/40 rounded transition-colors disabled:opacity-50"
                >
                    50 HIVE
                </button>
                <button
                    onClick={() => handleMinPowerUpChange('100')}
                    disabled={disabled}
                    className="px-3 py-1 text-xs font-mono text-terminal-green/70 hover:text-terminal-green bg-terminal-bg border border-terminal-green/20 hover:border-terminal-green/40 rounded transition-colors disabled:opacity-50"
                >
                    100 HIVE
                </button>
            </div>

            {parseFloat(localMinPowerUp) > 0 && (
                <div className="text-terminal-green/70 text-xs bg-green-900/10 border border-terminal-green/20 rounded px-3 py-2">
                    ✓ Filtrando Power Ups ≥ <span className="text-terminal-green font-bold">{localMinPowerUp} HIVE</span>
                </div>
            )}

            <div className="space-y-2 border-t border-terminal-green/20 pt-4">
                <label className="block text-sm text-terminal-green/90">
                    Requisito de Imágenes:
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleRequireImagesChange(false)}
                        disabled={disabled}
                        className={`flex-1 px-3 py-2 text-sm font-mono rounded transition-all border ${
                            !filters.requireImages
                                ? 'bg-terminal-green/20 border-terminal-green text-terminal-green'
                                : 'bg-terminal-bg border-terminal-green/30 text-terminal-green/50 hover:border-terminal-green/50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <ImageOff className="w-4 h-4" />
                            <span>Sin Imágenes</span>
                        </div>
                    </button>
                    <button
                        onClick={() => handleRequireImagesChange(true)}
                        disabled={disabled}
                        className={`flex-1 px-3 py-2 text-sm font-mono rounded transition-all border ${
                            filters.requireImages
                                ? 'bg-terminal-green/20 border-terminal-green text-terminal-green'
                                : 'bg-terminal-bg border-terminal-green/30 text-terminal-green/50 hover:border-terminal-green/50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Image className="w-4 h-4" />
                            <span>Con Imágenes</span>
                        </div>
                    </button>
                </div>
                <div className="text-xs text-terminal-green/40 italic">
                    {filters.requireImages
                        ? '📸 Solo usuarios que comentaron CON imágenes válidas'
                        : '⚡ Acepta usuarios que solo hicieron Power Up (sin imágenes)'}
                </div>
            </div>
        </div>
    );
}
