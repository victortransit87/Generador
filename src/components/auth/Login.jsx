import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [tempKey, setTempKey] = useState(localStorage.getItem('gemini_api_key') || '');

    const handleEnter = () => {
        if (tempKey) {
            localStorage.setItem('gemini_api_key', tempKey);
        }
        // Mock user login
        onLogin({ displayName: "Invitado", email: "guest@example.com" }, null);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] overflow-hidden relative">
            {/* Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-12 rounded-2xl max-w-md w-full text-center relative z-10"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-indigo-500/20 rounded-xl">
                        <Brain className="w-12 h-12 text-indigo-400" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Gemini Exam Gen
                </h1>
                <p className="text-gray-400 mb-8">
                    Crea exámenes tipo test desde tus apuntes.
                </p>

                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="password"
                            placeholder="Tu API Key de Gemini (Opcional aquí)"
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                            className="bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3"
                        />
                    </div>

                    <button
                        onClick={handleEnter}
                        className="w-full btn-primary flex items-center justify-center gap-3 group py-3"
                    >
                        Entrar a la Aplicación
                        <Sparkles className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>

                <p className="mt-6 text-xs text-gray-500">
                    Tu clave se guarda en local. Sin servidores.
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
