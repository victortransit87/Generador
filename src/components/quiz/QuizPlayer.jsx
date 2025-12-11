import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, ChevronRight, RotateCcw, Award } from 'lucide-react';

const QuizPlayer = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [quizStarted, setQuizStarted] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isChecked, setIsChecked] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);

    const startQuiz = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                alert('Formato JSON inválido. Debe ser un array de preguntas.');
                return;
            }
            setQuestions(parsed);
            setQuizStarted(true);
            setCurrentIndex(0);
            setScore(0);
            setQuizFinished(false);
            resetQuestionState();
        } catch (e) {
            alert('Error al leer el JSON. Asegúrate de copiarlo correctamente.');
        }
    };

    const resetQuestionState = () => {
        setSelectedOption(null);
        setIsChecked(false);
    };

    const currentQuestion = questions[currentIndex];

    const handleOptionSelect = (index) => {
        if (isChecked) return;
        setSelectedOption(index);
    };

    const handleCheck = () => {
        if (selectedOption === null) return;
        setIsChecked(true);
        if (selectedOption === currentQuestion.answer) {
            setScore(s => s + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(c => c + 1);
            resetQuestionState();
        } else {
            setQuizFinished(true);
        }
    };

    const restartQuiz = () => {
        setQuizStarted(false);
        setQuizFinished(false);
        resetQuestionState();
        setScore(0);
    };

    if (!quizStarted) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Modo Examen
                    </h2>
                    <p className="text-slate-400 mt-2">Pega el JSON de preguntas que generaste para comenzar el test.</p>
                </div>

                <div className="glass-panel p-6 rounded-xl">
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder='[ { "question": "..." } ]'
                        className="w-full h-48 bg-slate-900/50 p-4 rounded-lg font-mono text-sm text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>

                <button
                    onClick={startQuiz}
                    disabled={!jsonInput.trim()}
                    className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Play className="w-6 h-6" />
                    Comenzar Test
                </button>
            </div>
        );
    }

    if (quizFinished) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <div className="max-w-md mx-auto text-center space-y-8 glass-panel p-10 rounded-2xl animate-in fade-in zoom-in duration-300">
                <Award className="w-20 h-20 text-yellow-500 mx-auto" />
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">¡Examen Completado!</h2>
                    <p className="text-slate-400">Has finalizado todas las preguntas.</p>
                </div>

                <div className="p-6 bg-slate-800/50 rounded-xl">
                    <div className="text-5xl font-bold text-indigo-400 mb-2">{score}/{questions.length}</div>
                    <p className="text-sm font-medium text-slate-500">PUNTUACIÓN FINAL ({percentage}%)</p>
                </div>

                <button
                    onClick={restartQuiz}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                >
                    <RotateCcw className="w-5 h-5" />
                    Hacer otro test
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Pregunta {currentIndex + 1} de {questions.length}</span>
                    <span>Aciertos: {score}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                {/* Question Text */}
                <h3 className="text-xl font-semibold text-white mb-8 leading-relaxed">
                    {currentQuestion.question}
                </h3>

                {/* Options */}
                <div className="space-y-4">
                    {currentQuestion.options.map((option, idx) => {
                        let statusClass = "border-slate-700 hover:bg-slate-800/50";

                        if (isChecked) {
                            if (idx === currentQuestion.answer) {
                                statusClass = "border-green-500 bg-green-500/10 text-green-200";
                            } else if (idx === selectedOption && idx !== currentQuestion.answer) {
                                statusClass = "border-red-500 bg-red-500/10 text-red-200";
                            } else {
                                statusClass = "border-slate-700 opacity-50";
                            }
                        } else if (selectedOption === idx) {
                            statusClass = "border-indigo-500 bg-indigo-500/20 text-indigo-200";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(idx)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${statusClass}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-sm
                    ${isChecked && idx === currentQuestion.answer ? 'bg-green-500 border-green-500 text-white' :
                                            isChecked && idx === selectedOption ? 'bg-red-500 border-red-500 text-white' :
                                                selectedOption === idx ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-500 text-slate-500'}
                  `}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span>{option}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Feedback / Correction */}
                {isChecked && (
                    <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border-l-4 border-indigo-500 animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Explicación / Corrección
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {currentQuestion.explanation}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex justify-end">
                    {!isChecked ? (
                        <button
                            onClick={handleCheck}
                            disabled={selectedOption === null}
                            className="btn-primary px-8 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Comprobar
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="btn-primary px-8 flex items-center gap-2"
                        >
                            <span className="mr-1">{currentIndex === questions.length - 1 ? 'Finalizar' : 'Siguiente'}</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizPlayer;
