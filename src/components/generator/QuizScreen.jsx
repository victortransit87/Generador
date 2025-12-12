
import React, { useState } from 'react';
import { FileText, ArrowRight, Check, X, Search, Flag } from 'lucide-react';

const QuizScreen = ({ questions, mode = 'review', onComplete, onExit }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [answers, setAnswers] = useState(new Array(questions.length).fill(null));
    const [doubts, setDoubts] = useState(new Set());
    const [showFeedback, setShowFeedback] = useState(false);

    if (!questions || questions.length === 0) return null;

    const currentQ = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    const handleOptionSelect = (index) => {
        if (mode === 'review' && showFeedback) return;
        setSelectedOption(index);

        const newAnswers = [...answers];
        newAnswers[currentIndex] = index;
        setAnswers(newAnswers);

        if (mode === 'review') {
            setShowFeedback(true);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowFeedback(false);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        // Prepare results summary
        const results = questions.map((q, i) => ({
            question: q,
            answer: answers[i] !== null ? answers[i] : -1,
            correct: answers[i] === q.answer,
            doubt: doubts.has(i)
        }));
        onComplete(results);
    };

    const toggleDoubt = () => {
        const newDoubts = new Set(doubts);
        if (newDoubts.has(currentIndex)) newDoubts.delete(currentIndex);
        else newDoubts.add(currentIndex);
        setDoubts(newDoubts);
    };

    const searchGoogle = () => {
        const query = encodeURIComponent(currentQ.question);
        window.open(`https://www.google.com/search?q=${query}`, '_blank');
    };

    const getOptionClass = (idx) => {
        const base = "p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between group ";

        if (mode === 'review' && showFeedback) {
            if (idx === currentQ.answer) return base + "bg-green-500/10 border-green-500 text-green-400 font-medium";
            if (idx === selectedOption) return base + "bg-red-500/10 border-red-500 text-red-400";
            return base + "border-slate-700 opacity-50 cursor-not-allowed";
        }

        if (selectedOption === idx) return base + "bg-indigo-500/20 border-indigo-500 ring-1 ring-indigo-500 shadow-md";
        return base + "bg-slate-800/50 border-slate-700 hover:border-indigo-400 hover:bg-slate-800";
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in text-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onExit} className="text-slate-400 hover:text-white transition-colors">✕ Salir</button>
                    <span className="font-mono text-slate-500 text-sm">
                        {currentIndex + 1} / {questions.length}
                    </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={doubts.has(currentIndex)}
                        onChange={toggleDoubt}
                        className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 accent-amber-500"
                    />
                    <span className={`text-sm font-medium ${doubts.has(currentIndex) ? 'text-amber-500' : 'text-slate-400'}`}>
                        <Flag className="w-4 h-4 inline mr-1" /> Marcar Duda
                    </span>
                </label>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-slate-700 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Question Card */}
            <div className="bg-slate-900/50 rounded-2xl shadow-xl border border-slate-700 p-6 md:p-10 mb-6 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>

                <span className="inline-block bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded mb-4 uppercase tracking-wider border border-slate-700">
                    Epígrafe {currentQ.epigrafe}
                </span>

                <h2 className="text-xl md:text-2xl font-semibold text-white mb-8 leading-relaxed">
                    {currentQ.question}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                    {currentQ.options.map((opt, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleOptionSelect(idx)}
                            className={getOptionClass(idx)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all
                                    ${mode === 'review' && showFeedback && idx === currentQ.answer ? 'border-green-500 bg-green-500 text-white' :
                                        selectedOption === idx ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-500 text-slate-400 group-hover:border-indigo-300'}
                                `}>
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <span className="text-slate-200">{opt}</span>
                            </div>
                            {mode === 'review' && showFeedback && idx === currentQ.answer && <Check className="w-5 h-5 text-green-500" />}
                            {mode === 'review' && showFeedback && idx === selectedOption && idx !== currentQ.answer && <X className="w-5 h-5 text-red-500" />}
                        </div>
                    ))}
                </div>

                {/* Feedback Section */}
                {mode === 'review' && showFeedback && (
                    <div className="mt-8 pt-6 border-t border-slate-700 animate-fade-in">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Explicación</h3>
                        <p className="text-slate-300 bg-slate-800/50 p-4 rounded-lg border-l-4 border-indigo-500">
                            {currentQ.explanation || "Sin explicación predefinida."}
                        </p>
                        <div className="mt-4">
                            <button onClick={searchGoogle} className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors">
                                <Search className="w-4 h-4" /> Buscar en Google
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* NEXT Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleNext}
                    disabled={selectedOption === null}
                    className={`
                        px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform flex items-center gap-2
                        ${selectedOption === null
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-indigo-500/30'}
                    `}
                >
                    {currentIndex === questions.length - 1 ? 'Finalizar Examen' : 'Siguiente'}
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default QuizScreen;
