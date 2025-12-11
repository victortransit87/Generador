import React from 'react';

const ExamSettings = ({
    generationStrategy,
    setGenerationStrategy,
    targetLanguage,
    setTargetLanguage
}) => {
    return (
        <div className="flex flex-col gap-4 py-2 animate-in fade-in">
            {/* Strategy Selector */}
            <div className="flex justify-center gap-4">
                {['fast', 'medium', 'complete'].map(mode => (
                    <button
                        key={mode}
                        onClick={() => setGenerationStrategy(mode)}
                        className={`px-4 py-2 rounded-lg text-sm border transition-all flex flex-col items-center gap-1
                            ${generationStrategy === mode
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg scale-105'
                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <span className="font-bold uppercase tracking-wider text-[10px]">
                            {mode === 'fast' ? '⚡ Rápido' : mode === 'medium' ? '⚖️ Medio' : '🧠 Completo'}
                        </span>
                        <span className="text-[10px] opacity-70">
                            {mode === 'fast' ? '1 p/Epígrafe' : mode === 'medium' ? '3 p/Epígrafe' : '20 p/Epígrafe'}
                        </span>
                    </button>
                ))}
            </div>

            {/* Language Selector */}
            <div className="flex justify-center gap-2 items-center bg-slate-800/30 p-2 rounded-xl w-fit mx-auto border border-slate-700/50">
                <span className="text-xs text-slate-500 uppercase font-bold mr-2">Idioma Salida:</span>
                {['Spanish', 'English', 'Original'].map(lang => (
                    <button
                        key={lang}
                        onClick={() => setTargetLanguage(lang)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${targetLanguage === lang
                            ? 'bg-indigo-500 text-white shadow'
                            : 'text-slate-400 hover:bg-slate-700 hover:text-indigo-300'
                            }`}
                    >
                        {lang === 'Spanish' ? '🇪🇸 Español' : lang === 'English' ? '🇬🇧 English' : '📄 Original'}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ExamSettings;
