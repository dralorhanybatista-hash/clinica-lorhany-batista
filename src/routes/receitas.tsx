import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { jsPDF } from "jspdf";
import { Shell } from "@/components/Shell";
import { currentUser, loadData, saveData, today, uid, type ClinicData, type RxItem } from "@/lib/clinic";

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
  const viewer = currentUser()?.role === "visualizacao";

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
    setItems(saved.length ? saved : emptyItems());
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

  async function addLogoWatermark(doc: jsPDF) {
    try {
      const res = await fetch("/logo.jpg");
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const pageW = 210;
      const pageH = 297;
      const size = 130;
      const x = (pageW - size) / 2;
      const y = (pageH - size) / 2;
      const g = doc.GState({ opacity: 0.12 });
      doc.saveGraphicsState();
      doc.setGState(g);
      doc.addImage(dataUrl, "JPEG", x, y, size, size);
      doc.restoreGraphicsState();
    } catch {
      /* segue sem marca d'agua se o logo nao carregar */
    }
  }

  async function savePdf() {
    if (!person) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 20;
    await addLogoWatermark(doc);
    let y = 22;
    doc.setTextColor(139, 107, 58);
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("LORHANY BATISTA", pageW / 2, y, { align: "center" });
    y += 7;
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(154, 138, 120);
    doc.text("SAUDE E ESTETICA", pageW / 2, y, { align: "center" });
    y += 6;
    doc.setDrawColor(230, 221, 208);
    doc.line(margin, y, pageW - margin, y);
    y += 12;
    doc.setTextColor(44, 36, 28);
    doc.setFontSize(12);
    const when = date.split("-").reverse().join("/");
    doc.text(`Paciente: ${person.name}`, margin, y);
    doc.text(`Data: ${when}`, pageW - margin, y, { align: "right" });
    y += 10;
    if (use.trim()) {
      doc.text(`Uso: ${use.trim()}`, margin, y);
      y += 10;
    }
    for (let i = 0; i < lines.length; i++) {
      const item = lines[i];
      doc.setFont("times", "bold");
      const title = `${i + 1}. ${item.name}${item.dose ? ` — ${item.dose}` : ""}`;
      const titleLines = doc.splitTextToSize(title, pageW - margin * 2);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 6;
      if (item.posology) {
        doc.setFont("times", "italic");
        doc.setTextColor(107, 90, 74);
        const pos = doc.splitTextToSize(item.posology, pageW - margin * 2 - 6);
        doc.text(pos, margin + 6, y);
        y += pos.length * 6;
        doc.setTextColor(44, 36, 28);
      }
      y += 3;
      if (y > 250) {
        doc.addPage();
        await addLogoWatermark(doc);
        y = 20;
      }
    }
    if (notes.trim()) {
      y += 4;
      doc.setFont("times", "normal");
      const noteLines = doc.splitTextToSize(notes.trim(), pageW - margin * 2);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 6 + 8;
    }
    y = Math.max(y + 16, 250);
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("Enfª Lorhany Rodrigues Batista", pageW / 2, y, { align: "center" });
    y += 5;
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("Coren Go 242702", pageW / 2, y, { align: "center" });
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(107, 90, 74);
    doc.text("Ed. Focus Business Center — Av. T-2, 471 — St. Bueno, Goiânia — GO", pageW / 2, y, { align: "center" });
    const slug = person.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    doc.save(`receita-${slug || "paciente"}-${date}.pdf`);
  }

  return (
    <Shell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-serif text-3xl">Receituário</h1>
          <p className="text-sm text-taupe">O que você escrever aqui já aparece na folha</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={savePdf} disabled={!person}>
            Salvar PDF
          </button>
          <button type="button" className="btn-gold" onClick={() => window.print()} disabled={!person}>
            Imprimir
          </button>
        </div>
      </div>

      {!viewer && (
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
          <div key={i} className="grid gap-2 md:col-span-2 md:grid-cols-[1fr_1fr_1fr_auto]">
            <input
              className="input"
              placeholder={`Fórmula ou produto ${i + 1}`}
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
            <button
              type="button"
              className="btn-ghost px-3"
              onClick={() => setItems(items.length > 1 ? items.filter((_, idx) => idx !== i) : emptyItems())}
            >
              Tirar
            </button>
          </div>
        ))}
        <div className="md:col-span-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setItems([...items, { name: "", dose: "", posology: "" }])}
          >
            + Adicionar mais
          </button>
        </div>
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
              setItems(rec.items?.length ? rec.items : emptyItems());
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
      )}

      <article className="relative mx-auto min-h-[70vh] w-full max-w-[210mm] overflow-hidden bg-white px-8 py-8 shadow-sm">
        <img
          src="/logo.jpg"
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-[0.12] print:opacity-[0.16]"
        />
        <header className="relative z-10 flex items-center justify-center gap-4 border-b border-[#e6ddd0] pb-6 text-center">
          <img src="/logo.jpg" alt="" className="h-16 w-16 rounded-full object-cover" />
          <div>
            <div className="font-serif text-sm tracking-[0.35em] text-[#8B6B3A]">LORHANY BATISTA</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.4em] text-[#9a8a78]">Saúde e Estética</div>
          </div>
        </header>
        <div className="relative z-10 mt-8 flex flex-wrap justify-between gap-4 text-sm">
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
          <p className="relative z-10 mt-6 text-sm">
            <span className="tracking-widest text-[#6b5a4a]">USO:</span> {use}
          </p>
        )}
        <ol className="relative z-10 mt-8 min-h-[220px] space-y-4 font-serif text-[15px] leading-7">
          {lines.map((item, i) => (
            <li key={i}>
              <span className="font-medium">{i + 1}. {item.name}</span>
              {item.dose ? ` — ${item.dose}` : ""}
              {item.posology ? <div className="pl-5 text-[#6b5a4a]">{item.posology}</div> : null}
            </li>
          ))}
        </ol>
        {notes && <p className="relative z-10 mt-6 whitespace-pre-wrap text-sm leading-6">{notes}</p>}
        <footer className="relative z-10 mt-16 text-center text-xs text-[#6b5a4a]">
          <div className="font-medium">Enfª Lorhany Rodrigues Batista</div>
          <div>Coren Go 242702</div>
          <div className="mt-4 text-[11px]">Ed. Focus Business Center — Av. T-2, 471 — St. Bueno, Goiânia — GO</div>
        </footer>
      </article>
    </Shell>
  );
}
