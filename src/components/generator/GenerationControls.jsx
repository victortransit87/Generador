import React from 'react';
import { Loader2, Check } from 'lucide-react';

const GenerationControls = ({
    currentTopicIndex,
    totalTopics,
    totalQuestions,
    currentTopicName,
    isAutoGenerating,
    onToggleAuto,
    onGenerateNext,
    onStop,
    isProcessing
}) => {
    return (
        <div className="glass-panel p-6 border-indigo-500/50 animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400">Progreso: {currentTopicIndex} / {totalTopics} Temas</span>
                <span className="text-indigo-400 font-bold">{totalQuestions} Preguntas Totales</span>
            </div>

            <div className="w-full bg-slate-800/50 rounded-full h-2 mb-6 overflow-hidden">
                <div
                    className="bg-indigo-500 h-full transition-all duration-500 ease-out"
                    style={{ width: `${(currentTopicIndex / Math.max(totalTopics, 1)) * 100}%` }}
                />
            </div>

            <div className="mb-6 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <h3 className="text-xl font-bold text-white text-center">
                    {currentTopicName || "Finalizando..."}
                </h3>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onToggleAuto}
                    className={`flex-1 py-4 text-base font-medium rounded-xl border flex items-center justify-center gap-2 transition-all ${isAutoGenerating
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                        : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                        }`}
                >
                    {isAutoGenerating ? '⏸ Pausar Auto' : '▶ Activar Auto'}
                </button>

                {isProcessing && (
                    <button
                        onClick={onStop}
                        className="px-6 py-4 bg-red-500/20 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors flex items-center justify-center"
                        title="DETER GENERACIÓN"
                    >
                        ⏹
                    </button>
                )}

                <button
                    onClick={onGenerateNext}
                    disabled={isProcessing || isAutoGenerating}
                    className={`flex-[2] btn-primary py-4 text-lg flex items-center justify-center gap-3 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                    {isProcessing ? 'Generando...' : 'Generar Siguiente'}
                </button>
            </div>
        </div>
    );
};

export default GenerationControls;
