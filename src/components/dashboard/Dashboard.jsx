import React, { useState } from 'react';
import { LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react';
import QuestionGenerator from '../generator/QuestionGenerator';
import QuizPlayer from '../quiz/QuizPlayer';

const Dashboard = () => {
    return (
        <div className="flex h-screen bg-[#0f172a] text-slate-100 overflow-hidden font-sans">
            {/* Main Content */}
            <main className="flex-1 overflow-auto relative bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
                {/* Decorative background blobs */}
                <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="p-4 md:p-8 max-w-7xl mx-auto relative z-10">
                    <QuestionGenerator />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
