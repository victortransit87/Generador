import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { extractTextFromFile } from '../../utils/fileParser';
import { analyzeTopics, generateQuestions as generateGeminiQuestions, generateStructuralIndex as generateGeminiIndex } from '../../services/gemini';
import { generateQuestionsDeepSeek, analyzeTopicsDeepSeek, generateStructuralIndexDeepSeek, validateDeepSeekConnection } from '../../services/deepseek';

// Sub-components
import FileUploader from './FileUploader';
import TopicManager from './TopicManager';
import ExamSettings from './ExamSettings';
import GenerationControls from './GenerationControls';
import ResultsViewer from './ResultsViewer';

const QuestionGenerator = () => {
    // 1. Core State
    const [provider, setProvider] = useState('gemini'); // 'gemini' | 'deepseek'
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
    const [selectedTopics, setSelectedTopics] = useState(new Set());
    const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
    const [generationPhase, setGenerationPhase] = useState('idle'); // idle, analyzing, topic_confirmation, ready_to_generate, generating, completed
    const [progressStatus, setProgressStatus] = useState('');
    const [generatedQuestions, setGeneratedQuestions] = useState(null);
    const [isAutoGenerating, setIsAutoGenerating] = useState(false);

    // 3. Settings State
    const [targetLanguage, setTargetLanguage] = useState('Spanish');
    const [generationStrategy, setGenerationStrategy] = useState('medium');

    // Load API Key on mount or provider change
    useEffect(() => {
        const keyName = provider === 'gemini' ? 'gemini_api_key' : 'deepseek_api_key';
        const savedKey = localStorage.getItem(keyName);
        setApiKey(savedKey || '');
    }, [provider]);

    const handleApiKeyChange = (val) => {
        setApiKey(val);
        const keyName = provider === 'gemini' ? 'gemini_api_key' : 'deepseek_api_key';
        localStorage.setItem(keyName, val);
    };

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

            let detectedTopics;
            if (provider === 'gemini') {
                detectedTopics = await analyzeTopics(apiKey, extractedTextRef.current);
            } else {
                detectedTopics = await analyzeTopicsDeepSeek(apiKey, extractedTextRef.current);
            }

            if (!detectedTopics || detectedTopics.length === 0) throw new Error("No topics found");

            setTopics(detectedTopics);
            setSelectedTopics(new Set(detectedTopics.map((_, i) => i)));
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

            let detectedTopics;
            if (provider === 'gemini') {
                detectedTopics = await generateGeminiIndex(apiKey, extractedTextRef.current);
            } else {
                detectedTopics = await generateStructuralIndexDeepSeek(apiKey, extractedTextRef.current);
            }

            setTopics(detectedTopics);
            // Default select all
            setSelectedTopics(new Set(detectedTopics.map((_, i) => i)));

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

    // Selection Logic
    const handleToggleTopic = (index) => {
        if (!topics) return;
        const newSet = new Set(selectedTopics);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedTopics(newSet);
    };

    const handleToggleAll = (shouldSelectAll) => {
        if (!topics) return;
        if (shouldSelectAll) {
            setSelectedTopics(new Set(topics.map((_, i) => i)));
        } else {
            setSelectedTopics(new Set());
        }
    };

    const handleConfirmTopics = () => {
        // Find the first selected topic to start with
        let firstSelectedIndex = 0;
        if (topics && selectedTopics) {
            for (let i = 0; i < topics.length; i++) {
                if (selectedTopics.has(i)) {
                    firstSelectedIndex = i;
                    break;
                }
            }
        }
        setCurrentTopicIndex(firstSelectedIndex);
        setGenerationPhase('ready_to_generate');
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

            // Strategy Targets
            let targetCount = 10;
            if (generationStrategy === 'fast') targetCount = 1;
            else if (generationStrategy === 'medium') targetCount = 3;
            else if (generationStrategy === 'complete') targetCount = 20;

            // Count existing questions per topic
            const existingCounts = {};
            if (generatedQuestions) {
                generatedQuestions.forEach(q => {
                    // Epigrafe is 1-based usually in my logic, matches index + 1
                    const idx = (q.epigrafe || 1) - 1;
                    existingCounts[idx] = (existingCounts[idx] || 0) + 1;
                });
            }

            while (tempIndex < topics.length) {
                // 1. Check if selected
                if (!selectedTopics.has(tempIndex)) {
                    tempIndex++;
                    continue; // Skip unselected
                }

                // 2. Check overlap logic (Gap Fill)
                const currentCount = existingCounts[tempIndex] || 0;
                let needed = targetCount - currentCount;

                // If fully satisfied, skip
                if (needed <= 0) {
                    tempIndex++;
                    continue;
                }

                // 3. Add to batch
                if (currentBatchCount + needed > QUESTION_BUDGET) {
                    // If fitting "needed" exceeds budget, can we fit partial?
                    // Strategy: If batch is empty, squeeze it in (max 20).
                    // If batch has items, break and save for next.
                    if (batchTopics.length > 0) break;

                    // If needed > 20 (unlikely with header limit), cap at 20.
                    if (needed > QUESTION_BUDGET) needed = QUESTION_BUDGET;
                }

                batchTopics.push({ topic: topics[tempIndex].topic, count: needed, originalIndex: tempIndex });
                currentBatchCount += needed;

                // If we filled the budget exactly, we might want to break, or loop once more to seeing check.
                // Actually, let's just break. The next loop will re-evaluate.
                // IMPORTANT: If we generated 'needed', next time 'currentCount' will be higher.
                // But we won't know that until the AI returns.
                // So we must increment tempIndex so UI moves forward optimistically?
                // No, for the Loop logic, we want to advance tempIndex so we resume AFTER this batch.
                if (currentBatchCount >= QUESTION_BUDGET) {
                    tempIndex++;
                    break;
                }

                tempIndex++;
            }

            // If no topics needed work, we are done
            if (batchTopics.length === 0) {
                // Check if we scanned everything
                if (tempIndex >= topics.length) {
                    setGenerationPhase('completed');
                    setIsAutoGenerating(false);
                    setProgressStatus('Todos los temas completados según la configuración actual.');
                } else {
                    // Maybe just finished selection block?
                    setCurrentTopicIndex(tempIndex);
                }
                setIsProcessing(false);
                return;
            }

            setProgressStatus(`Generando ${currentBatchCount} preguntas para ${batchTopics.length} temas (Rellenando huecos)...`);

            // Map back to format expected by API?
            // API expects { topic: string, count: number }
            const apiBatch = batchTopics.map(b => ({ topic: b.topic, count: b.count }));

            let batchResults;
            if (provider === 'gemini') {
                batchResults = await generateGeminiQuestions(
                    apiKey,
                    extractedTextRef.current,
                    apiBatch,
                    5,
                    targetLanguage,
                    abortControllerRef.current.signal
                );
            } else {
                batchResults = await generateQuestionsDeepSeek(
                    apiKey,
                    extractedTextRef.current,
                    apiBatch,
                    5,
                    targetLanguage,
                    abortControllerRef.current.signal
                );
            }

            if (Array.isArray(batchResults)) {
                // We need to ensure the questions have the correct 'epigrafe' index.
                // The API might assign 1, 2, 3... relative to the batch.
                // We need to map them back to absolute topic indices.
                // The prompt says "Epigrafe X".
                // Current AI service logic relies on the order.
                // Let's manually patch the 'epigrafe' field to match 'originalIndex + 1'.

                // Re-distribute questions to topics?
                // We know we asked for [Count A, Count B]. The result is a flat array.
                // We assume order is preserved.

                let resultCursor = 0;
                const fixedResults = [];

                batchTopics.forEach(bt => {
                    // For each topic in batch, grab 'count' questions (or as many as AI gave).
                    // This is tricky if AI returned fewer.
                    // Simplified: Just assigning sequential Epigrafe numbers based on the batch topics isn't enough if we skipped topics.
                    // We want Epigrafe ID to match the Topic Index + 1.

                    // Let's assume the AI returns them roughly in order. We can try to align?
                    // Or simpler: Trust the AI's 'epigrafe' number is 1..N based on the prompt list.
                    // If batch has Topic A (1st in prompt) and Topic B (2nd in prompt).
                    // AI returns Epigrafe 1 -> Topic A. Epigrafe 2 -> Topic B.
                    // We map batchTopics[0] -> ID batchTopics[0].originalIndex + 1.

                    // We iterate the results and try to assign?
                    // No, easier: update generatesQuestions to just append.
                    // The 'epigrafe' field is mostly for display/sorting.
                    // Let's blindly trust for now, or patch if critical.
                    // User request: "Check numbers".
                    // I will perform a naive patch if 'epigrafe' 1..N matches batch order.
                });

                // Correction: The AI Service logic likely assigns Epigrafe 1, 2, 3 to the batch.
                // We should remap these to the GLOBAL topic index.
                let currentBatchTopicIndex = 0;
                let questionsForCurrentTopic = 0;

                const mappedResults = batchResults.map(q => {
                    // Heuristic to assign to correct global topic
                    // We move to next batch topic if we exceed count? Or rely on 'epigrafe' provided by AI?
                    // AI provides 'epigrafe': 1 for first topic in list, 2 for second.
                    const relativeEp = q.epigrafe || 1;
                    const batchTopic = batchTopics[relativeEp - 1]; // 0-indexed
                    if (batchTopic) {
                        return { ...q, epigrafe: batchTopic.originalIndex + 1 };
                    }
                    return q;
                });

                setGeneratedQuestions(prev => prev ? [...prev, ...mappedResults] : mappedResults);
            }

            setCurrentTopicIndex(tempIndex);

            if (tempIndex >= topics.length) {
                setGenerationPhase('completed');
                setIsAutoGenerating(false);
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
                    <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button
                            onClick={() => setProvider('gemini')}
                            className={`px-3 py-1 text-xs rounded transition-all ${provider === 'gemini' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Gemini
                        </button>
                        <button
                            onClick={() => setProvider('deepseek')}
                            className={`px-3 py-1 text-xs rounded transition-all flex items-center gap-1 ${provider === 'deepseek' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span>🐋</span> DeepSeek
                        </button>
                    </div>

                    <input
                        type="password"
                        placeholder={`Pegar API Key de ${provider === 'gemini' ? 'Google' : 'DeepSeek'}`}
                        value={apiKey}
                        onChange={(e) => handleApiKeyChange(e.target.value)}
                        className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none w-48 transition-all"
                    />
                    <button
                        onClick={async () => {
                            if (!apiKey) return alert("Introduce una API Key primero.");
                            try {
                                alert(`Conectando con ${provider === 'gemini' ? 'Gemini' : 'DeepSeek'}...`);
                                if (provider === 'gemini') {
                                    const { detectBestModel } = await import('../../services/gemini');
                                    const model = await detectBestModel(apiKey);
                                    alert(`✅ Conectado: ${model}`);
                                } else {
                                    const models = await validateDeepSeekConnection(apiKey);
                                    alert(`✅ Conectado: ${models[0]}`);
                                }
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
                        onConfirm={handleConfirmTopics}
                        isProcessing={isProcessing}
                        onSaveTopics={handleSaveTopics}
                        onLoadTopics={handleLoadTopics}
                        onRestoreSession={handleRestoreJson}
                        selectedTopics={selectedTopics}
                        onToggleTopic={handleToggleTopic}
                        onToggleAll={handleToggleAll}
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
