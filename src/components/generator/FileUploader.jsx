import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Check, Loader2, FileText } from 'lucide-react';

const FileUploader = ({ onDrop, file, isProcessing, progressStatus, generationPhase, extractedTextLength, onAnalyze, onAiIndex }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt']
        },
        multiple: false,
        disabled: isProcessing || generationPhase !== 'idle'
    });

    return (
        <div className="glass-panel p-8 min-h-[300px] flex flex-col items-center justify-center dashed-border transition-all">
            {generationPhase === 'idle' && !file && (
                <div {...getRootProps()} className="text-center cursor-pointer hover:scale-105 transition-transform">
                    <input {...getInputProps()} />
                    <Upload className={`w-16 h-16 mx-auto mb-4 transition-colors ${isDragActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {isDragActive ? "Suelta el archivo aquí..." : "Arrastra tu archivo aquí"}
                    </h3>
                    <p className="text-slate-400">PDF, DOCX o TXT</p>
                </div>
            )}

            {file && generationPhase !== 'analyzing' && (
                <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white max-w-xs mx-auto truncate" title={file.name}>{file.name}</h3>
                        <p className="text-indigo-300 text-sm mt-1">
                            {Math.round(file.size / 1024)} KB
                            {extractedTextLength > 0 && ` • ${extractedTextLength.toLocaleString()} caracteres`}
                        </p>
                    </div>

                    {generationPhase === 'idle' && (
                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={onAiIndex}
                                disabled={isProcessing}
                                className="btn-primary py-3 text-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                <span>✨</span>
                                {isProcessing ? 'Procesando...' : 'Crear Índice Inteligente (IA)'}
                            </button>

                            <button
                                onClick={onAnalyze}
                                disabled={isProcessing}
                                className="py-3 text-sm text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : '↺'}
                                Detectar Índice Clásico (Regex)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {isProcessing && (
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-indigo-300 animate-pulse">{progressStatus || "Procesando..."}</p>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
