import React from 'react';
import { Check, Loader2 } from 'lucide-react';

const TopicManager = ({ topics, onAnalyze, onAiIndex, onConfirm, isProcessing, onSaveTopics, onLoadTopics, onRestoreSession }) => {
    if (!topics) return null;

    return (
        <div className="glass-panel p-6 border-indigo-500/50 space-y-4 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-3 text-indigo-400 mb-2">
                <Check className="w-6 h-6" />
                <h3 className="text-xl font-bold">Índice Detectado</h3>
            </div>

            <div className="max-h-60 overflow-y-auto bg-slate-900/50 rounded-lg p-3 space-y-2 custom-scrollbar">
                {topics.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-800/30 rounded border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                        <span className="text-slate-200 font-medium truncate flex-1 mr-4" title={t.topic}>
                            {t.topic}
                        </span>
                        <span className="text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded text-xs whitespace-nowrap border border-indigo-500/20">
                            ~{t.count} pregs
                        </span>
                    </div>
                ))}
            </div>

            {/* Actions Row 1: Refinement */}
            <div className="flex gap-2">
                <button
                    onClick={onAnalyze}
                    disabled={isProcessing}
                    className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors disabled:opacity-50 text-xs flex items-center justify-center gap-1"
                    title="Usar detector Regex"
                >
                    <span>↺</span> Regex
                </button>
                <button
                    onClick={onAiIndex}
                    disabled={isProcessing}
                    className="flex-1 py-2 rounded-lg border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 transition-colors disabled:opacity-50 text-xs flex items-center justify-center gap-1"
                    title="Usar IA"
                >
                    <span>✨</span> IA
                </button>
            </div>

            {/* Actions Row 2: Import/Export/Restore */}
            <div className="flex gap-2 border-t border-slate-700/50 pt-2">
                <button
                    onClick={onSaveTopics}
                    disabled={isProcessing}
                    className="flex-1 py-2 bg-slate-800 rounded-lg text-slate-400 text-xs hover:text-white transition-colors flex items-center justify-center gap-1"
                    title="Descargar Índice (TXT)"
                >
                    📥 Bajar Index
                </button>

                <div className="relative flex-1">
                    <input
                        type="file"
                        accept=".txt,.json"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => e.target.files[0] && onLoadTopics(e.target.files[0])}
                        disabled={isProcessing}
                    />
                    <button
                        disabled={isProcessing}
                        className="w-full py-2 bg-slate-800 rounded-lg text-slate-400 text-xs hover:text-white transition-colors flex items-center justify-center gap-1"
                    >
                        📤 Subir Index
                    </button>
                </div>

                <div className="relative flex-1">
                    <input
                        type="file"
                        accept=".json"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => e.target.files[0] && onRestoreSession(e.target.files[0])}
                        disabled={isProcessing}
                    />
                    <button
                        disabled={isProcessing}
                        className="w-full py-2 bg-slate-700/50 rounded-lg text-amber-200/80 text-xs hover:bg-amber-900/20 transition-colors flex items-center justify-center gap-1 border border-amber-500/10"
                    >
                        📂 Restaurar
                    </button>
                </div>
            </div>

            {/* Actions Row 3: Confirm */}
            <div className="pt-2">
                <button
                    onClick={onConfirm}
                    disabled={isProcessing}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Check className="w-5 h-5" />
                    Confirmar y Empezar
                </button>
            </div>
        </div>
    );
};

export default TopicManager;
