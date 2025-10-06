import { useState, useEffect } from 'react';
import { parseHiveUrl, buildPeakdUrl } from '../utils/parseHiveUrl';
import type { PostInfo } from '../types/hive';

interface PostUrlInputProps {
    readonly onPostChange: (postInfo: PostInfo) => void;
    readonly disabled?: boolean;
    readonly initialAuthor?: string;
    readonly initialPermlink?: string;
}

export default function PostUrlInput({
    onPostChange,
    disabled = false,
    initialAuthor = '',
    initialPermlink = ''
}: PostUrlInputProps) {
    const [url, setUrl] = useState<string>('');
    const [author, setAuthor] = useState<string>(initialAuthor);
    const [permlink, setPermlink] = useState<string>(initialPermlink);
    const [error, setError] = useState<string>('');
    const [isManualMode, setIsManualMode] = useState<boolean>(false);

    // Inicializar con valores por defecto si existen
    useEffect(() => {
        if (initialAuthor && initialPermlink) {
            const initialUrl = buildPeakdUrl(initialAuthor, initialPermlink);
            setUrl(initialUrl);
            setAuthor(initialAuthor);
            setPermlink(initialPermlink);
        }
    }, [initialAuthor, initialPermlink]);

    const handleUrlChange = (value: string): void => {
        setUrl(value);
        setError('');

        if (!value.trim()) {
            setAuthor('');
            setPermlink('');
            return;
        }

        const parsed = parseHiveUrl(value);

        if (parsed.isValid) {
            setAuthor(parsed.author);
            setPermlink(parsed.permlink);
            onPostChange({
                author: parsed.author,
                permlink: parsed.permlink
            });
        } else {
            setError(parsed.error || 'URL inválida');
            setAuthor('');
            setPermlink('');
        }
    };

    const handleManualAuthorChange = (value: string): void => {
        const cleanValue = value.replace('@', '').toLowerCase().trim();
        setAuthor(cleanValue);

        if (cleanValue && permlink) {
            onPostChange({
                author: cleanValue,
                permlink
            });
            setError('');
        }
    };

    const handleManualPermlinkChange = (value: string): void => {
        const cleanValue = value.toLowerCase().trim();
        setPermlink(cleanValue);

        if (author && cleanValue) {
            onPostChange({
                author,
                permlink: cleanValue
            });
            setError('');
        }
    };

    const toggleMode = (): void => {
        setIsManualMode(!isManualMode);
        setError('');

        // Si cambiamos a modo manual y tenemos author/permlink, construir URL
        if (!isManualMode && author && permlink) {
            setUrl(buildPeakdUrl(author, permlink));
        }
    };

    const clearForm = (): void => {
        setUrl('');
        setAuthor('');
        setPermlink('');
        setError('');
        // Notificar al padre que se limpió el formulario
        onPostChange({
            author: '',
            permlink: ''
        });
    };

    return (
        <div className="space-y-4 border border-terminal-green/30 rounded p-4 bg-terminal-bg/50">
            <div className="flex items-center justify-between mb-2">
                <div className="text-terminal-green text-sm">
                    <span className="text-terminal-green/70">$</span> ./configure-post.sh
                </div>
                <button
                    onClick={toggleMode}
                    disabled={disabled}
                    className="text-xs text-terminal-green/70 hover:text-terminal-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isManualMode ? '🔗 Modo URL' : '✏️ Modo Manual'}
                </button>
            </div>

            {!isManualMode ? (
                <div className="space-y-2">
                    <label htmlFor="post-url" className="block text-sm text-terminal-green/90">
                        URL del Post (Peakd, Hive.blog, Ecency):
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="post-url"
                            type="text"
                            value={url}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            disabled={disabled}
                            placeholder="https://peakd.com/@hiveblocks-es/permlink"
                            className="flex-1 bg-black/30 border border-terminal-green/30 rounded px-3 py-2 text-terminal-green placeholder-terminal-green/30 focus:outline-none focus:border-terminal-green/70 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                        />
                        {url && (
                            <button
                                onClick={clearForm}
                                disabled={disabled}
                                className="px-3 py-2 bg-red-900/20 border border-red-500/30 rounded text-red-400 hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="author" className="block text-sm text-terminal-green/90">
                            Username:
                        </label>
                        <input
                            id="author"
                            type="text"
                            value={author}
                            onChange={(e) => handleManualAuthorChange(e.target.value)}
                            disabled={disabled}
                            placeholder="hiveblocks-es"
                            className="w-full bg-black/30 border border-terminal-green/30 rounded px-3 py-2 text-terminal-green placeholder-terminal-green/30 focus:outline-none focus:border-terminal-green/70 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="permlink" className="block text-sm text-terminal-green/90">
                            Permlink:
                        </label>
                        <input
                            id="permlink"
                            type="text"
                            value={permlink}
                            onChange={(e) => handleManualPermlinkChange(e.target.value)}
                            disabled={disabled}
                            placeholder="hive-power-day-..."
                            className="w-full bg-black/30 border border-terminal-green/30 rounded px-3 py-2 text-terminal-green placeholder-terminal-green/30 focus:outline-none focus:border-terminal-green/70 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="text-red-400 text-xs bg-red-900/20 border border-red-500/30 rounded px-3 py-2">
                    ⚠️ {error}
                </div>
            )}

            {author && permlink && !error && (
                <div className="text-terminal-green/70 text-xs space-y-1 bg-green-900/10 border border-terminal-green/20 rounded px-3 py-2">
                    <div>✓ <span className="text-terminal-green/50">Author:</span> <span className="text-terminal-green">@{author}</span></div>
                    <div>✓ <span className="text-terminal-green/50">Permlink:</span> <span className="text-terminal-green">{permlink}</span></div>
                </div>
            )}

            <div className="text-xs text-terminal-green/40 italic">
                💡 Tip: Pega la URL completa del post o ingresa author/permlink manualmente
            </div>
        </div>
    );
}
