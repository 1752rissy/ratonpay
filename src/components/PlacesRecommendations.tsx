import { MapPin, Beer, Pizza, Coffee, UtensilsCrossed, Music, Trophy } from "lucide-react";
import React from "react";

const PLACES_CATEGORIES = [
    { name: "Cervecerías", icon: Beer, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", query: "cervecerias cerca" },
    { name: "Boliches", icon: Music, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20", query: "boliches discotecas cerca" },
    { name: "Pizzerías", icon: Pizza, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", query: "pizzerias cerca" },
    { name: "Restaurantes", icon: UtensilsCrossed, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", query: "restaurantes cerca" },
    { name: "Cafeterías", icon: Coffee, color: "text-yellow-600", bg: "bg-yellow-600/10", border: "border-yellow-600/20", query: "cafeterias cerca" },
    { name: "Canchas Fútbol", icon: Trophy, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", query: "canchas de futbol cerca" },
];

export default function PlacesRecommendations() {
    const handleSearch = (query: string) => {
        // Generates a Google Maps search URL
        const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <MapPin className="w-24 h-24 text-zinc-400" />
            </div>

            <div className="flex items-center gap-2 mb-4 relative z-10">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <h3 className="text-white font-bold tracking-tight">¿Dónde vamos?</h3>
            </div>

            <p className="text-sm text-zinc-400 mb-6 relative z-10">
                Encuentra lugares cercanos en Google Maps para armar la próxima salida.
            </p>

            <div className="grid grid-cols-2 gap-3 relative z-10">
                {PLACES_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.name}
                            onClick={() => handleSearch(cat.query)}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${cat.border} ${cat.bg} hover:bg-zinc-800 transition-colors active:scale-95`}
                        >
                            <Icon className={`w-5 h-5 ${cat.color}`} />
                            <span className={`text-xs font-bold ${cat.color} uppercase tracking-wider`}>
                                {cat.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
