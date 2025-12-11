import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { extractTextFromFile } from '../../utils/fileParser';
import { analyzeTopics, generateQuestions } from '../../services/gemini';

// Sub-components
import FileUploader from './FileUploader';
import TopicManager from './TopicManager';
import ExamSettings from './ExamSettings';
import GenerationControls from './GenerationControls';
import ResultsViewer from './ResultsViewer';

const QuestionGenerator = () => {
    // 1. Core State
    const [apiKey, setApiKey] = useState('');
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    // Performance Optimization: Store huge text in Ref, only length in State
    const extractedTextRef = useRef('');
    const [extractedTextLength, setExtractedTextLength] = useState(0);
    const abortControllerRef = useRef(null); // Reference for cancellation

    // 2. Generation Logic State
    const [topics, setTopics] = useState(null);
    const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
    const [generationPhase, setGenerationPhase] = useState('idle'); // idle, analyzing, topic_confirmation, ready_to_generate, generating, completed
    const [progressStatus, setProgressStatus] = useState('');
    const [generatedQuestions, setGeneratedQuestions] = useState(null);
    const [isAutoGenerating, setIsAutoGenerating] = useState(false);

    // 3. Settings State
    const [targetLanguage, setTargetLanguage] = useState('Spanish');
    const [generationStrategy, setGenerationStrategy] = useState('medium');

    // Load API Key on mount
    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) setApiKey(savedKey);
    }, []);

    // Handlers
    const onDrop = useCallback(async (acceptedFiles) => {
        const uploadedFile = acceptedFiles[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            setGeneratedQuestions(null);
            setError(null);
            setGenerationPhase('idle');
            setTopics(null);
            extractedTextRef.current = '';
            setExtractedTextLength(0);

            try {
                setIsProcessing(true);
                setProgressStatus('Leyendo archivo...');
                const text = await extractTextFromFile(uploadedFile);
                extractedTextRef.current = text;
                setExtractedTextLength(text.length);
            } catch (err) {
                setError('Error reading file: ' + err.message);
            } finally {
                setIsProcessing(false);
                setProgressStatus('');
            }
        }
    }, []);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsProcessing(false);
        setIsAutoGenerating(false);
        setProgressStatus('Generación detenida por el usuario.');
    };

    const handleAnalyze = async () => {
        if (!apiKey) return setError('Por favor, introduce tu API Key.');
        if (!extractedTextRef.current) return setError('Primero sube un documento.');

        try {
            setIsProcessing(true);
            setGenerationPhase('analyzing');
            setProgressStatus('Analizando estructura del documento...');
            setError(null);

            const detectedTopics = await analyzeTopics(apiKey, extractedTextRef.current);

            if (!detectedTopics || detectedTopics.length === 0) throw new Error("No topics found");

            setTopics(detectedTopics);
            setCurrentTopicIndex(0);
            setGeneratedQuestions([]);
            setGenerationPhase('topic_confirmation');
        } catch (err) {
            console.warn("Analysis failed:", err);
            setError('No pudimos detectar temas automáticamente. Intenta con "Mejorar con IA".');
            setGenerationPhase('idle');
        } finally {
            setIsProcessing(false);
            setProgressStatus('');
        }
    };

    const handleAiIndexCreation = async () => {
        if (!apiKey || !extractedTextRef.current) return;
        try {
            setIsProcessing(true);
            setGenerationPhase('analyzing');
            setProgressStatus('La IA está creando un índice inteligente...');

            const { generateStructuralIndex } = await import('../../services/gemini');
            const detectedTopics = await generateStructuralIndex(apiKey, extractedTextRef.current);

            setTopics(detectedTopics);
            setGeneratedQuestions([]);
            setGenerationPhase('topic_confirmation');
        } catch (e) {
            setError("Error IA: " + e.message);
            setGenerationPhase('idle');
        } finally {
            setIsProcessing(false);
            setProgressStatus('');
        }
    };

    // State for Restoration
    const handleRestoreJson = async (jsonFile) => {
        if (!apiKey) return setError('Por favor, introduce tu API Key antes de restaurar.');
        if (!extractedTextRef.current) return setError('Primero sube el documento original (PDF/DOCX) para poder enlazar las preguntas.');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const jsonContent = JSON.parse(e.target.result);
                if (!Array.isArray(jsonContent)) throw new Error("El archivo JSON no tiene el formato correcto (debe ser un array).");

                setIsProcessing(true);
                setProgressStatus('Restaurando sesión y analizando estructura original...');

                // 1. Restore Questions
                setGeneratedQuestions(jsonContent);

                // 2. Re-Analyze Topics (Regex) to map progress
                // We need to know the structure to fill the bars
                const detectedTopics = await analyzeTopics(apiKey, extractedTextRef.current);
                setTopics(detectedTopics);

                // 3. Calculate Progress
                // We assume "Complete" strategy (20 q) as a safe baseline or just check what's there.
                // Or better: check max epigrafe in JSON.

                const questionsByEpigrafe = {};
                jsonContent.forEach(q => {
                    const ep = q.epigrafe || 0;
                    questionsByEpigrafe[ep] = (questionsByEpigrafe[ep] || 0) + 1;
                });

                // Find first topic that needs work?
                // Logic: If topic has < 1 question, it's "pending". 
                // If it has questions, we assume it's "worked on". 
                // We set the index to the first 'empty' topic usually.

                let resumeIndex = 0;
                for (let i = 0; i < detectedTopics.length; i++) {
                    const epNum = i + 1; // Assuming 1-based mapping roughly
                    // Actually, rely on topic order.
                    // If we have questions for topic i...

                    // Simple heuristic: If we have questions for this epigrafe (topic index + 1), it's done.
                    // Resume at the first one that has 0 questions.
                    if ((questionsByEpigrafe[i + 1] || 0) > 0) {
                        resumeIndex = i + 1;
                    } else {
                        // Found a gap or the end of processed work
                        resumeIndex = i;
                        break;
                    }
                }

                // Cap index
                if (resumeIndex >= detectedTopics.length) resumeIndex = detectedTopics.length - 1;

                setCurrentTopicIndex(resumeIndex);
                setGenerationPhase('ready_to_generate');
                setError(null);

            } catch (err) {
                setError("Error al restaurar JSON: " + err.message);
            } finally {
                setIsProcessing(false);
                setProgressStatus('');
            }
        };
        reader.readAsText(jsonFile);
    };

    const handleSaveTopics = () => {
        if (!topics || topics.length === 0) return;
        const blob = new Blob([JSON.stringify(topics, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `indice_temas_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
    };

    const handleLoadTopics = async (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedTopics = JSON.parse(e.target.result);
                if (!Array.isArray(loadedTopics)) throw new Error("Formato inválido.");
                setTopics(loadedTopics);
                setGenerationPhase('topic_confirmation');
            } catch (err) {
                setError("Error cargando índice: " + err.message);
            }
        };
        reader.readAsText(file);
    };

    const handleGenerateNextBatch = async () => {
        try {
            setIsProcessing(true);
            setGenerationPhase('generating');

            // Invoke AbortController
            abortControllerRef.current = new AbortController();

            const QUESTION_BUDGET = 20; // Safety limit per request
            let batchTopics = [];
            let currentBatchCount = 0;
            let tempIndex = currentTopicIndex;

            while (tempIndex < topics.length) {
                const topic = topics[tempIndex];

                // Determine base count from Strategy
                let requestedCount = 10; // Default base
                if (generationStrategy === 'fast') requestedCount = 1;
                else if (generationStrategy === 'medium') requestedCount = 3;
                else if (generationStrategy === 'complete') requestedCount = 20; // 20 per topic for deep mode

                // If topic provided a specific count (from heuristic), respect it IF it's reasonable
                if (topic.count) {
                    // Only override if topic.count is higher than strategy default? 
                    // Or just trust strategy? 
                    // Let's trust strategy as the user override.
                }

                // Check if already done (Restoration check)
                // If we are restoring, we might want to skip topics that are already fully populated?
                // But the user might want to *add* more.
                // Let's rely on currentTopicIndex. If the user set it manually or via restore, we start there.

                // Stop if budget exceeded
                if (currentBatchCount + requestedCount > QUESTION_BUDGET && batchTopics.length > 0) break;

                batchTopics.push({ topic: topic.topic, count: requestedCount });
                currentBatchCount += requestedCount;
                tempIndex++;
            }

            setProgressStatus(`Generando ${currentBatchCount} preguntas para ${batchTopics.length} temas...`);

            const batchResults = await generateQuestions(
                apiKey,
                extractedTextRef.current,
                batchTopics,
                5,
                targetLanguage,
                abortControllerRef.current.signal // Pass signal
            );

            if (Array.isArray(batchResults)) {
                setGeneratedQuestions(prev => prev ? [...prev, ...batchResults] : batchResults);
            }

            setCurrentTopicIndex(tempIndex);

            if (tempIndex >= topics.length) {
                setGenerationPhase('completed');
                setIsAutoGenerating(false);
            } else {
                setGenerationPhase('ready_to_generate');
            }

        } catch (e) {
            if (e.message.includes('cancelada')) {
                setError("Generación detenida.");
            } else {
                setError("Error generando: " + e.message);
            }
            setGenerationPhase('ready_to_generate');
            setIsAutoGenerating(false);
        } finally {
            setIsProcessing(false);
            setProgressStatus('');
            abortControllerRef.current = null;
        }
    };

    // Auto-generate Effect
    useEffect(() => {
        let timer;
        if (isAutoGenerating && generationPhase === 'ready_to_generate' && !isProcessing) {
            timer = setTimeout(() => handleGenerateNextBatch(), 1000);
        }
        return () => clearTimeout(timer);
    }, [isAutoGenerating, generationPhase, isProcessing]);

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Header / API Key */}
            <div className="glass-panel p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Generador de Exámenes</h1>
                        <p className="text-xs text-slate-400">v2.0 Refactor • Powered by Gemini</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="password"
                        placeholder="Pegar Gemini API Key"
                        value={apiKey}
                        onChange={(e) => {
                            setApiKey(e.target.value);
                            localStorage.setItem('gemini_api_key', e.target.value);
                        }}
                        className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none w-48 transition-all"
                    />
                    <button
                        onClick={async () => {
                            if (!apiKey) return alert("Introduce una API Key primero.");
                            try {
                                const { detectBestModel } = await import('../../services/gemini');
                                alert("Conectando...");
                                const model = await detectBestModel(apiKey);
                                alert(`✅ Conectado: ${model}`);
                            } catch (e) { alert("❌ Error: " + e.message); }
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                        title="Verificar conexión"
                    >
                        ⚡
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* 1. File Uploader Area */}
            <FileUploader
                onDrop={onDrop}
                file={file}
                isProcessing={isProcessing}
                progressStatus={progressStatus}
                generationPhase={generationPhase}
                extractedTextLength={extractedTextLength}
                onAnalyze={handleAnalyze}
                onAiIndex={handleAiIndexCreation}
                onRestore={handleRestoreJson}
            />

            {/* 2. Topic Confirmation & Settings */}
            {generationPhase === 'topic_confirmation' && (
                <>
                    <ExamSettings
                        generationStrategy={generationStrategy}
                        setGenerationStrategy={setGenerationStrategy}
                        targetLanguage={targetLanguage}
                        setTargetLanguage={setTargetLanguage}
                    />
                    <TopicManager
                        topics={topics}
                        onAnalyze={handleAnalyze}
                        onAiIndex={handleAiIndexCreation}
                        onConfirm={() => setGenerationPhase('ready_to_generate')}
                        isProcessing={isProcessing}
                        onSaveTopics={handleSaveTopics}
                        onLoadTopics={handleLoadTopics}
                        onRestoreSession={handleRestoreJson}
                    />
                </>
            )}

            {/* 3. Generation Control Loop */}
            {(generationPhase === 'ready_to_generate' || generationPhase === 'generating' || generationPhase === 'completed') && topics && (
                <GenerationControls
                    currentTopicIndex={currentTopicIndex}
                    totalTopics={topics.length}
                    totalQuestions={generatedQuestions?.length || 0}
                    currentTopicName={topics[currentTopicIndex]?.topic}
                    isAutoGenerating={isAutoGenerating}
                    onToggleAuto={() => setIsAutoGenerating(!isAutoGenerating)}
                    onGenerateNext={handleGenerateNextBatch}
                    onStop={handleStop}
                    isProcessing={isProcessing}
                />
            )}

            {/* 4. Results */}
            <ResultsViewer generatedQuestions={generatedQuestions} />
        </div>
    );
};

export default QuestionGenerator;
