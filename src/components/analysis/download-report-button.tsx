'use client';

import { Download, FileJson, Printer } from 'lucide-react';
import { AnalysisResults } from '@/app/actions';

export function DownloadReportButton({ report }: { report: AnalysisResults }) {
    const handlePrint = () => {
        window.print();
    };

    const handleDownloadJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `unearth-report-${report.reportId}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="flex space-x-2 print:hidden">
            <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                <Printer className="mr-2 h-4 w-4" />
                Save as PDF
            </button>
            <button
                onClick={handleDownloadJson}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                <FileJson className="mr-2 h-4 w-4" />
                JSON
            </button>
        </div>
    );
}
