import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Shell } from "@/components/Shell";
import { loadData, saveData, today, uid, type ClinicData, type RxItem } from "@/lib/clinic";

const searchSchema = z.object({ print: z.string().optional(), patient: z.string().optional() });
const emptyItems = (): RxItem[] => [
  { name: "", dose: "", posology: "" },
  { name: "", dose: "", posology: "" },
  { name: "", dose: "", posology: "" },
  { name: "", dose: "", posology: "" },
];

export const Route = createFileRoute("/receitas")({
  validateSearch: searchSchema,
  component: Receitas,
});

function Receitas() {
  const { print, patient } = Route.useSearch();
  const [data, setData] = useState<ClinicData | null>(null);
  const [patientId, setPatientId] = useState(patient || "");
  const [date, setDate] = useState(today());
  const [use, setUse] = useState("Externo");
  const [items, setItems] = useState<RxItem[]>(emptyItems);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<string | null>(print ?? null);

  useEffect(() => setData(loadData()), []);

  useEffect(() => {
    if (!data || !print) return;
    const rec = data.prescriptions.find((r) => r.id === print);
    if (!rec) return;
    setSelected(rec.id);
    setPatientId(rec.patientId);
    setDate(rec.date);
    setUse(rec.use || "");
    setNotes(rec.notes || rec.body || "");
    const saved = rec.items?.length ? rec.items : [];
    setItems([...saved, ...emptyItems()].slice(0, 4));
  }, [data, print]);

  const person = data?.patients.find((p) => p.id === patientId);
  const lines = useMemo(() => items.filter((i) => i.name.trim() || i.dose.trim() || i.posology.trim()), [items]);
  if (!data) return null;

  function save(e: FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    const rec = {
      id: selected || uid("r"),
      patientId,
      date,
      use,
      items: lines,
      notes,
      body: lines.map((i) => [i.name, i.dose, i.posology].filter(Boolean).join(" — ")).join("\n") + (notes ? `\n${notes}` : ""),
    };
    const rest = data!.prescriptions.filter((r) => r.id !== rec.id);
    const next = { ...data!, prescriptions: [rec, ...rest] };
    saveData(next);
    setData(next);
    setSelected(rec.id);
  }

  return (
    <Shell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-serif text-3xl">Receituário</h1>
          <p className="text-sm text-taupe">O que você escrever aqui já aparece na folha</p>
        </div>
        <button className="btn-gold" onClick={() => window.print()} disabled={!person}>
          Imprimir
        </button>
      </div>

      <form onSubmit={save} className="card mb-6 grid gap-3 p-4 print:hidden md:grid-cols-2">
        <label>
          <span className="label">Paciente</span>
          <select className="input" value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
            <option value="">Selecione</option>
            {data.patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Data</span>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="md:col-span-2">
          <span className="label">Uso</span>
          <input className="input" value={use} onChange={(e) => setUse(e.target.value)} placeholder="Externo, oral, tópico..." />
        </label>
        {items.map((item, i) => (
          <div key={i} className="grid gap-2 md:col-span-2 md:grid-cols-3">
            <input
              className="input"
              placeholder="Fórmula ou produto"
              value={item.name}
              onChange={(e) => setItems(items.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
            />
            <input
              className="input"
              placeholder="Dose"
              value={item.dose}
              onChange={(e) => setItems(items.map((x, idx) => (idx === i ? { ...x, dose: e.target.value } : x)))}
            />
            <input
              className="input"
              placeholder="Como usar"
              value={item.posology}
              onChange={(e) => setItems(items.map((x, idx) => (idx === i ? { ...x, posology: e.target.value } : x)))}
            />
          </div>
        ))}
        <label className="md:col-span-2">
          <span className="label">Orientação</span>
          <textarea className="input h-20" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Cuidados, retorno, observações" />
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button className="btn-gold">Salvar receita</button>
          <select
            className="input max-w-xs"
            value={selected || ""}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) {
                setSelected(null);
                setItems(emptyItems());
                setNotes("");
                return;
              }
              const rec = data.prescriptions.find((r) => r.id === id);
              if (!rec) return;
              setSelected(rec.id);
              setPatientId(rec.patientId);
              setDate(rec.date);
              setUse(rec.use || "");
              setNotes(rec.notes || rec.body || "");
              setItems([...(rec.items || []), ...emptyItems()].slice(0, 4));
            }}
          >
            <option value="">Nova</option>
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
      </form>

      <article className="relative mx-auto min-h-[70vh] w-full max-w-[210mm] bg-white px-8 py-8 shadow-sm">
        <header className="flex items-center justify-center gap-4 border-b border-[#e6ddd0] pb-6 text-center">
          <img src="/logo.jpg" alt="" className="h-16 w-16 rounded-full object-cover" />
          <div>
            <div className="font-serif text-sm tracking-[0.35em] text-[#8B6B3A]">LORHANY BATISTA</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.4em] text-[#9a8a78]">Saúde e Estética</div>
          </div>
        </header>
        <div className="mt-8 flex flex-wrap justify-between gap-4 text-sm">
          <div>
            <span className="tracking-widest text-[#6b5a4a]">PACIENTE:</span>{" "}
            <span className="inline-block min-w-56 border-b border-[#2c241c] px-2">{person?.name || ""}</span>
          </div>
          <div>
            <span className="tracking-widest text-[#6b5a4a]">DATA:</span>{" "}
            <span className="border-b border-[#2c241c] px-2">{date.split("-").reverse().join("/")}</span>
          </div>
        </div>
        {use && (
          <p className="mt-6 text-sm">
            <span className="tracking-widest text-[#6b5a4a]">USO:</span> {use}
          </p>
        )}
        <ol className="mt-8 min-h-[220px] space-y-4 font-serif text-[15px] leading-7">
          {lines.map((item, i) => (
            <li key={i}>
              <span className="font-medium">{i + 1}. {item.name}</span>
              {item.dose ? ` — ${item.dose}` : ""}
              {item.posology ? <div className="pl-5 text-[#6b5a4a]">{item.posology}</div> : null}
            </li>
          ))}
        </ol>
        {notes && <p className="mt-6 whitespace-pre-wrap text-sm leading-6">{notes}</p>}
        <footer className="mt-16 text-center text-xs text-[#6b5a4a]">
          <div className="font-medium">Enfª Lorhany Rodrigues Batista</div>
          <div>Coren Go 242702</div>
          <div className="mt-4 text-[11px]">Ed. Focus Business Center — Av. T-2, 471 — St. Bueno, Goiânia — GO</div>
        </footer>
      </article>
    </Shell>
  );
}
