'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ScoreDisplayProps {
    score?: number;
}

const getScoreColor = (score: number) => {
    if (score > 75) return '#22c55e'; // green-500
    if (score > 40) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
}

export function ScoreDisplay({ score = 0 }: ScoreDisplayProps) {
    const color = getScoreColor(score);
    const data = [
        { name: 'Score', value: score },
        { name: 'Remaining', value: 100 - score },
    ];

    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md">
                   <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline">Misinformation Immunity Score</CardTitle>
                    <CardDescription>Overall content trust rating (0-100).</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full h-40 relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                startAngle={90}
                                endAngle={-270}
                                innerRadius="70%"
                                outerRadius="100%"
                                cornerRadius={5}
                                paddingAngle={0}
                                dataKey="value"
                                stroke="none"
                            >
                                <Cell fill={color} />
                                <Cell fill="hsl(var(--muted))" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl font-bold font-headline" style={{ color }}>{score}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
