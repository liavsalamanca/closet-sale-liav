"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Entrar() {
  const router = useRouter();
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    const r = await fetch("/api/panel/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contrasena }),
    }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    setCargando(false);
    if (r?.ok) router.replace("/panel");
    else setError(j?.error ?? "No pude conectarme. Intenta de nuevo.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={entrar} className="tarjeta flex w-full max-w-sm flex-col gap-5 p-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="text-center text-3xl">Mi panel</h1>
        <div>
          <label htmlFor="contrasena" className="etiqueta mb-2 block text-rosegold-oscuro">
            Contraseña
          </label>
          <input
            id="contrasena"
            type="password"
            className="campo"
            autoComplete="current-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
            autoFocus
          />
        </div>
        <p role="alert" className="min-h-5 text-sm font-medium text-[#9b2c2c]">
          {error}
        </p>
        <button
          type="submit"
          disabled={cargando}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cacao px-6 text-sm font-medium text-crema disabled:opacity-60"
        >
          {cargando ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Lock size={18} aria-hidden />}
          Entrar
        </button>
      </form>
    </main>
  );
}
