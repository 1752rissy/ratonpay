"use client";

import { motion } from "framer-motion";

interface Friend {
    id: string;
    name: string;
    status: 'pending' | 'paid';
    amount: number;
}

interface PizzaVisualizerProps {
    friends: Friend[];
}

export default function PizzaVisualizer({ friends }: PizzaVisualizerProps) {
    const totalSlices = friends.length;
    const sliceDegrees = 360 / totalSlices;

    // Function to create a slice path
    const createSlicePath = (index: number) => {
        const startAngle = index * sliceDegrees;
        const endAngle = (index + 1) * sliceDegrees;

        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);

        const x1 = 50 + 50 * Math.cos(startRad);
        const y1 = 50 + 50 * Math.sin(startRad);
        const x2 = 50 + 50 * Math.cos(endRad);
        const y2 = 50 + 50 * Math.sin(endRad);

        return `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
    };

    return (
        <div className="relative w-64 h-64 mx-auto my-8">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl transform rotate-0">
                {friends.map((friend, index) => (
                    <motion.path
                        key={friend.id}
                        d={createSlicePath(index)}
                        fill={friend.status === 'paid' ? '#10b981' : '#27272a'} // emerald-500 : zinc-800
                        stroke="#09090b" // zinc-950
                        strokeWidth="2"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                        whileHover={{ scale: 1.05 }}
                    />
                ))}
                {/* Crust / Outer Ring */}
                <circle cx="50" cy="50" r="48" fill="none" stroke="#3f3f46" strokeWidth="1" className="opacity-50" />
            </svg>

            {/* Center text could go here if needed */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-zinc-900/80 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm shadow-sm border border-zinc-700 text-white">
                    {friends.filter(f => f.status === 'paid').length}/{totalSlices}
                </div>
            </div>
        </div>
    );
}
