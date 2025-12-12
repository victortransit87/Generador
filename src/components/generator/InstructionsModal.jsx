
import React, { useState } from 'react';
import { X, BookOpen, Key, ExternalLink, HelpCircle } from 'lucide-react';

const InstructionsModal = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('guide'); // 'guide' | 'keys'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-indigo-400" />
                        Centro de Ayuda
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab('guide')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2
                            ${activeTab === 'guide' ? 'bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}
                        `}
                    >
                        <BookOpen className="w-4 h-4" /> Cómo Funciona
                    </button>
                    <button
                        onClick={() => setActiveTab('keys')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2
                            ${activeTab === 'keys' ? 'bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}
                        `}
                    >
                        <Key className="w-4 h-4" /> Conseguir API Keys
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {activeTab === 'guide' ? (
                        <div className="space-y-6 text-slate-300">
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold border border-blue-500/30">1</span>
                                <div>
                                    <h3 className="font-bold text-white mb-1">Elige tu IA</h3>
                                    <p className="text-sm">Selecciona <strong>Gemini</strong> (Google, Rápido y Gratis) o <strong>DeepSeek</strong> (Mejor Razonamiento, Pago). Introduce tu API Key.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold border border-blue-500/30">2</span>
                                <div>
                                    <h3 className="font-bold text-white mb-1">Sube tu Documento</h3>
                                    <p className="text-sm">Arrastra tu PDF, DOCX o TXT. El sistema extraerá el texto automáticamente.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold border border-blue-500/30">3</span>
                                <div>
                                    <h3 className="font-bold text-white mb-1">Detectar Temas</h3>
                                    <p className="text-sm">Usa "Detectar Índice" para que la IA escanee la estructura. Puedes seleccionar qué epígrafes estudiar.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold border border-green-500/30">4</span>
                                <div>
                                    <h3 className="font-bold text-white mb-1">Generar Examen</h3>
                                    <p className="text-sm">Configura la dificultad y pulsa "Generar Todo" o ve lote por lote. Al final, podrás descargar un PDF o hacer el test interactivo.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">5</span>
                                <div>
                                    <h3 className="font-bold text-white mb-1">Hacer Test Interactivo</h3>
                                    <p className="text-sm">Pulsa "Hacer Test" para descargar el examen (JSON) y abrir la web del lector. Luego sube ese archivo allí.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 text-slate-300">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <span className="text-indigo-400">⚡</span> Google Gemini API (Opción Gratuita)
                                </h3>
                                <p className="text-sm mb-4">Es la opción recomendada para empezar. Google ofrece una capa gratuita generosa.</p>
                                <ol className="list-decimal list-inside text-sm space-y-2 mb-4 text-slate-400">
                                    <li>Visita Google AI Studio.</li>
                                    <li>Inicia sesión con tu cuenta de Google.</li>
                                    <li>Pulsa en "Get API key" -> "Create API key".</li>
                                    <li>Copia la clave y pégala aquí.</li>
                                </ol>
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors"
                                >
                                    Obtener Clave Gemini <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>

                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <span className="text-blue-400">🐋</span> DeepSeek API (Opción Pro)
                                </h3>
                                <p className="text-sm mb-4">Ideal para preguntas de razonamiento complejo. Requiere añadir saldo ($).</p>
                                <ol className="list-decimal list-inside text-sm space-y-2 mb-4 text-slate-400">
                                    <li>Regístrate en DeepSeek Platform.</li>
                                    <li>Ve a "API Keys" y crea una nueva.</li>
                                    <li>Recarga saldo (Top up) si es necesario.</li>
                                </ol>
                                <a
                                    href="https://platform.deepseek.com/api_keys"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
                                >
                                    Obtener Clave DeepSeek <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800/50 border-t border-slate-700 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstructionsModal;
