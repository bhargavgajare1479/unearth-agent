'use client';

import { useState } from 'react';
import { voteOnReport } from '@/app/actions';

export function VoteControl({ reportId, initialVotes }: { reportId: string, initialVotes?: { up: number, down: number } }) {
    const [votes, setVotes] = useState(initialVotes || { up: 0, down: 0 });
    const [hasVoted, setHasVoted] = useState(false);

    const handleVote = async (type: 'up' | 'down') => {
        if (hasVoted) return;

        // Optimistic update
        setVotes(prev => ({
            ...prev,
            [type]: prev[type] + 1
        }));
        setHasVoted(true);

        try {
            await voteOnReport(reportId, type);
        } catch (error) {
            console.error("Failed to vote:", error);
            // Revert on failure
            setVotes(prev => ({
                ...prev,
                [type]: prev[type] - 1
            }));
            setHasVoted(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-3 rounded-lg bg-gray-50 p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700">Was this analysis helpful?</h4>
            <div className="flex space-x-4">
                <button
                    onClick={() => handleVote('up')}
                    disabled={hasVoted}
                    className={`flex items-center space-x-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${hasVoted
                            ? 'bg-green-100 text-green-800 cursor-default'
                            : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-300'
                        }`}
                >
                    <span>👍 Helpful</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">{votes.up}</span>
                </button>

                <button
                    onClick={() => handleVote('down')}
                    disabled={hasVoted}
                    className={`flex items-center space-x-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${hasVoted
                            ? 'bg-red-100 text-red-800 cursor-default'
                            : 'bg-white text-gray-700 hover:bg-red-50 hover:text-red-700 border border-gray-300'
                        }`}
                >
                    <span>👎 Incorrect</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">{votes.down}</span>
                </button>
            </div>
            {hasVoted && <p className="text-xs text-green-600">Thank you for your feedback!</p>}
        </div>
    );
}
