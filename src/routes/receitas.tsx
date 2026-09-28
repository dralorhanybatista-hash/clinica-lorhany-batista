import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Shell } from "@/components/Shell";
import { loadData, type ClinicData } from "@/lib/clinic";

const searchSchema = z.object({ print: z.string().optional() });

export const Route = createFileRoute("/receitas")({
  validateSearch: searchSchema,
  component: Receitas,
});

function Receitas() {
  const { print } = Route.useSearch();
  const [data, setData] = useState<ClinicData | null>(null);
  const [selected, setSelected] = useState<string | null>(print ?? null);
  useEffect(() => setData(loadData()), []);
  useEffect(() => {
    if (print) setSelected(print);
  }, [print]);
  const rec = useMemo(() => data?.prescriptions.find((r) => r.id === selected), [data, selected]);
  const patient = data?.patients.find((p) => p.id === rec?.patientId);
  if (!data) return null;

  return (
    <Shell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-serif text-3xl">Receituário</h1>
          <p className="text-sm text-taupe">Imprima em folha A4</p>
        </div>
        <button className="btn-gold" onClick={() => window.print()} disabled={!rec}>
          Imprimir
        </button>
      </div>
      <div className="card mb-6 p-4 print:hidden">
        <label className="label">Receita salva</label>
        <select className="input max-w-lg" value={selected || ""} onChange={(e) => setSelected(e.target.value || null)}>
          <option value="">Selecione</option>
          {data.prescriptions.map((r) => {
            const p = data.patients.find((x) => x.id === r.patientId);
            return (
              <option key={r.id} value={r.id}>
                {r.date} — {p?.name || "Paciente"}
              </option>
            );
          })}
        </select>
      </div>
      <article className="relative mx-auto min-h-[70vh] w-full max-w-[210mm] bg-white px-8 py-8 shadow-sm">
        <header className="flex items-center justify-center gap-4 border-b border-[#e6ddd0] pb-6 text-center">
          <img src="/logo.jpg" alt="" className="h-16 w-16 rounded-full object-cover" />
          <div>
            <div className="font-serif text-sm tracking-[0.35em] text-[#8B6B3A]">LORHANY BATISTA</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.4em] text-[#9a8a78]">Saúde e Estética</div>
          </div>
        </header>
        <div className="mt-10 text-sm">
          <span className="tracking-widest text-[#6b5a4a]">PACIENTE:</span>{" "}
          <span className="inline-block min-w-[70%] border-b border-[#2c241c] px-2">{patient?.name || ""}</span>
        </div>
        <div className="mt-10 min-h-[280px] whitespace-pre-wrap font-serif text-[15px] leading-7">{rec?.body || ""}</div>
        <footer className="mt-16 text-center text-xs text-[#6b5a4a]">
          <div className="font-medium">Enfª Lorhany Rodrigues Batista</div>
          <div>Coren Go 242702</div>
          <div className="mt-4 text-[11px]">Ed. Focus Business Center — Av. T-2, 471 — St. Bueno, Goiânia — GO</div>
        </footer>
      </article>
    </Shell>
  );
}
