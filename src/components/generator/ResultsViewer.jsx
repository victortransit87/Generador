import React, { useState } from 'react';
import { Copy, Download, FileText, FileDown, PlayCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QuizScreen from './QuizScreen'; // Import the new component

const ResultsViewer = ({ generatedQuestions }) => {
    const [isTestMode, setIsTestMode] = useState(false);

    if (!generatedQuestions || generatedQuestions.length === 0) return null;

    // --- TEST MODE HANDLER ---
    if (isTestMode) {
        return (
            <QuizScreen
                questions={generatedQuestions}
                mode="review" // Allows instant feedback
                onComplete={(results) => {
                    const score = results.filter(r => r.correct).length;
                    alert(`Examen Finalizado.\nAciertos: ${score} de ${results.length} (${Math.round(score / results.length * 100)}%)`);
                    setIsTestMode(false);
                }}
                onExit={() => setIsTestMode(false)}
            />
        );
    }

    // --- NORMAL MODE HANDLERS ---
    const copyToClipboard = () => {
        navigator.clipboard.writeText(JSON.stringify(generatedQuestions, null, 2));
        alert('¡Preguntas copiadas!');
    };

    const downloadJson = () => {
        const blob = new Blob([JSON.stringify(generatedQuestions, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `examen_ia_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
    };

    const downloadPdf = () => {
        try {
            const doc = new jsPDF();
            const date = new Date().toLocaleDateString();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(40, 40, 40);
            doc.text("Examen Generado por IA", 105, 20, { align: "center" });

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Fecha: ${date} | Total Preguntas: ${generatedQuestions.length} `, 105, 28, { align: "center" });

            doc.setLineWidth(0.5);
            doc.line(20, 32, 190, 32);

            let yPos = 40;
            const pageHeight = doc.internal.pageSize.height;

            // Questions Loop
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);

            generatedQuestions.forEach((q, i) => {
                // Check page break
                if (yPos > pageHeight - 40) {
                    doc.addPage();
                    yPos = 20;
                }

                // Question Title
                doc.setFont("helvetica", "bold");
                const splitTitle = doc.splitTextToSize(`${i + 1}. ${q.question} `, 170);
                doc.text(splitTitle, 20, yPos);
                yPos += (splitTitle.length * 7);

                // Options
                doc.setFont("helvetica", "normal");
                q.options.forEach((opt, idx) => {
                    const label = String.fromCharCode(65 + idx);
                    const splitOpt = doc.splitTextToSize(`${label}) ${opt} `, 160);
                    doc.text(splitOpt, 25, yPos);
                    yPos += (splitOpt.length * 6);
                });

                yPos += 8; // Spacing between questions
            });

            // Answer Key Page
            doc.addPage();
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("Clave de Respuestas", 105, 20, { align: "center" });

            const tableData = generatedQuestions.map((q, i) => [
                (i + 1).toString(),
                String.fromCharCode(65 + q.answer),
                q.explanation || "Sin explicación"
            ]);

            autoTable(doc, {
                startY: 30,
                head: [['#', 'Rpta', 'Explicación']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] }, // Indigo color
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 15, halign: 'center' }
                }
            });

            doc.save(`examen_generado_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (e) {
            console.error("PDF Error:", e);
            alert("Error al generar PDF. Asegúrate de que el texto no tenga caracteres extraños.");
        }
    };

    return (
        <div className="glass-panel rounded-xl overflow-hidden p-4 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    Resultados ({generatedQuestions.length})
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsTestMode(true)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <PlayCircle className="w-4 h-4" /> Hacer Test
                    </button>
                    <button
                        onClick={copyToClipboard}
                        className="px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded hover:bg-slate-700 text-sm flex items-center gap-2 transition-colors"
                        title="Copiar JSON"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    <button
                        onClick={downloadJson}
                        className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 text-sm flex items-center gap-2 transition-colors"
                        title="Descargar JSON"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        onClick={downloadPdf}
                        className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 text-sm flex items-center gap-2 transition-colors"
                        title="Descargar PDF"
                    >
                        <FileDown className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="max-h-96 overflow-y-auto font-mono text-xs text-slate-300 space-y-4 pr-2 custom-scrollbar">
                {generatedQuestions.map((q, i) => (
                    <div key={i} className="p-3 bg-slate-800/50 rounded border border-slate-700/50 hover:bg-slate-800 transition-colors">
                        <div className="flex gap-2 mb-2">
                            <span className="text-indigo-400 font-bold">#{i + 1}</span>
                            <p className="text-white font-semibold">{q.question}</p>
                        </div>
                        <div className="pl-6 space-y-1 text-slate-400">
                            {q.options.map((opt, idx) => (
                                <div key={idx} className={`flex gap - 2 ${idx === q.answer ? 'text-green-400' : ''} `}>
                                    <span>{String.fromCharCode(65 + idx)})</span>
                                    <span>{opt}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResultsViewer;
