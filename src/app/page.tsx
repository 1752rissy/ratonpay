import Link from "next/link";
import { ArrowRight, Receipt, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <main className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-green-500 p-4 rounded-full shadow-lg">
              <Receipt className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Rata MVP
          </h1>
          <p className="text-lg text-slate-600">
            Divide la cuenta con tus amigos sin vueltas. Rápido, fácil y sin instalar nada.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              ¿Como funciona?
            </h2>
            <ul className="space-y-3 text-slate-600">
              <li className="flex gap-2">
                <span className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Ingresá el monto y cuántos son.</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Compartí el link generado por WhatsApp.</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Cada uno paga su parte con MercadoPago.</span>
              </li>
            </ul>
          </div>

          <Link
            href="/create"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            Empezar Ahora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>

      <footer className="mt-12 text-center text-slate-400 text-sm">
        Hecho para dividir gastos, no amistades.
      </footer>
    </div>
  );
}
