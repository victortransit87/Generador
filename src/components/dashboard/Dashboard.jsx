import React, { useState } from 'react';
import { LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react';
import QuestionGenerator from '../generator/QuestionGenerator';
import QuizPlayer from '../quiz/QuizPlayer';

const Dashboard = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('generator');

    return (
        <div className="flex h-screen bg-[#0f172a] text-slate-100 overflow-hidden font-sans">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex w-64 glass-panel border-r border-slate-700/50 flex-col z-20">
                <div className="p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Gemini Gen
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">v1.1.0 Premium</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'generator'
                            ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Generador</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('quiz')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'quiz'
                            ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <FileText size={20} />
                        <span className="font-medium">Hacer Test</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{user.displayName}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/10 transition-colors text-sm"
                    >
                        <LogOut size={16} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-lg border-t border-slate-700 z-50 px-6 py-3 flex justify-around pb-6">
                <button
                    onClick={() => setActiveTab('generator')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'generator' ? 'text-indigo-400' : 'text-slate-500'}`}
                >
                    <LayoutDashboard size={24} />
                    <span className="text-xs">Generar</span>
                </button>
                <button
                    onClick={() => setActiveTab('quiz')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'quiz' ? 'text-indigo-400' : 'text-slate-500'}`}
                >
                    <FileText size={24} />
                    <span className="text-xs">Test</span>
                </button>
                <button
                    onClick={onLogout}
                    className="flex flex-col items-center gap-1 text-slate-500 hover:text-red-400"
                >
                    <LogOut size={24} />
                    <span className="text-xs">Salir</span>
                </button>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
                {/* Decorative background blobs */}
                <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="p-8 max-w-7xl mx-auto relative z-10">
                    {activeTab === 'generator' && <QuestionGenerator />}
                    {activeTab === 'quiz' && <QuizPlayer />}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
