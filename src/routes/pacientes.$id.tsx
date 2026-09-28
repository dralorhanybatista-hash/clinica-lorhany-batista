import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { brl, loadData, saveData, today, uid, type ClinicData, type VisitItem } from "@/lib/clinic";

export const Route = createFileRoute("/pacientes/$id")({ component: Ficha });

const TABS = ["Prontuário", "Atendimento", "Orçamentos", "Fotos", "Receita"] as const;

function Ficha() {
  const { id } = Route.useParams();
  const [data, setData] = useState<ClinicData | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Prontuário");
  useEffect(() => setData(loadData()), []);
  if (!data) return null;
  const p = data.patients.find((x) => x.id === id);
  if (!p) {
    return (
      <Shell>
        <p>
          Paciente não encontrado. <Link to="/pacientes">Voltar</Link>
        </p>
      </Shell>
    );
  }
  const visits = data.visits.filter((v) => v.patientId === p.id);
  const budgets = data.budgets.filter((b) => b.patientId === p.id);
  const photos = data.photos.filter((ph) => ph.patientId === p.id);
  const recs = data.prescriptions.filter((r) => r.patientId === p.id);

  function persist(next: ClinicData) {
    saveData(next);
    setData(next);
  }

  return (
    <Shell>
      <Link to="/pacientes" className="text-sm text-taupe">
        ← Pacientes
      </Link>
      <h1 className="mt-2 font-serif text-3xl">{p.name}</h1>
      <p className="mb-4 text-sm text-taupe">
        {p.phone || "sem telefone"} · {visits.length} evoluções · {photos.length} fotos
      </p>
      <div className="mb-5 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 text-sm ${tab === t ? "bg-gold-dark text-white" : "bg-white text-taupe"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Prontuário" && (
        <div className="card p-4">
          <p className="mb-3 text-sm text-taupe">{p.notes}</p>
          {visits.length === 0 && <p className="text-sm text-taupe">Nenhuma evolução. Use a aba Atendimento.</p>}
          <ol className="space-y-4">
            {visits.map((v) => (
              <li key={v.id} className="border-l-2 border-gold pl-4 text-sm">
                <p className="font-medium">
                  {v.date} · {v.type}
                </p>
                <p className="text-taupe">{v.evolution}</p>
                <ul>
                  {v.items.map((i, idx) => (
                    <li key={idx}>
                      {i.desc} · {i.charged ? brl(i.amount) : "sem custo"}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      )}

      {tab === "Atendimento" && (
        <VisitForm
          patientName={p.name}
          onSave={(visit, finance) => {
            persist({ ...data, visits: [visit, ...data.visits], finance: [...finance, ...data.finance] });
            setTab("Prontuário");
          }}
          patientId={p.id}
        />
      )}

      {tab === "Orçamentos" && (
        <form
          className="card space-y-3 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            persist({
              ...data,
              budgets: [
                { id: uid("b"), patientId: p.id, date: String(fd.get("date")), desc: String(fd.get("desc")), amount: Number(fd.get("amount") || 0), status: "enviado" },
                ...data.budgets,
              ],
            });
            e.currentTarget.reset();
          }}
        >
          <h3 className="font-serif text-lg">Orçamento</h3>
          <input name="date" type="date" className="input" defaultValue={today()} required />
          <input name="desc" className="input" placeholder="Protocolo ou procedimento" required />
          <input name="amount" type="number" step="0.01" className="input" placeholder="Valor" required />
          <button className="btn-gold">Salvar</button>
          {budgets.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-parchment p-3 text-sm">
              <span>
                {b.date} · {b.desc} · {brl(b.amount)} · {b.status}
              </span>
              <span className="flex gap-1">
                {(["aprovado", "recusado"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    className="rounded border border-parchment px-2 py-0.5 text-xs"
                    onClick={() => persist({ ...data, budgets: data.budgets.map((x) => (x.id === b.id ? { ...x, status: st } : x)) })}
                  >
                    {st}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </form>
      )}

      {tab === "Fotos" && (
        <div className="card p-4">
          <h3 className="mb-3 font-serif text-lg">Antes e depois</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            <select id="kind" className="input max-w-[140px]">
              <option value="antes">Antes</option>
              <option value="depois">Depois</option>
            </select>
            <input id="area" className="input max-w-[180px]" placeholder="Área" />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const kind = (document.getElementById("kind") as HTMLSelectElement).value as "antes" | "depois";
                  const area = (document.getElementById("area") as HTMLInputElement).value;
                  persist({
                    ...data,
                    photos: [{ id: uid("ph"), patientId: p.id, kind, area, dataUrl: String(reader.result), date: today() }, ...data.photos],
                  });
                };
                reader.readAsDataURL(file);
              }}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["antes", "depois"] as const).map((k) => (
              <div key={k}>
                <h4 className="mb-2 text-xs uppercase text-taupe">{k}</h4>
                {photos
                  .filter((ph) => ph.kind === k)
                  .map((ph) => (
                    <figure key={ph.id} className="mb-2 overflow-hidden rounded-lg border border-parchment">
                      <img src={ph.dataUrl} alt={k} className="max-h-72 w-full object-cover" />
                      <figcaption className="px-2 py-1 text-xs text-taupe">
                        {ph.date}
                        {ph.area ? ` · ${ph.area}` : ""}
                      </figcaption>
                    </figure>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Receita" && (
        <form
          className="card space-y-3 p-4"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            persist({
              ...data,
              prescriptions: [{ id: uid("r"), patientId: p.id, date: String(fd.get("date")), body: String(fd.get("body")) }, ...data.prescriptions],
            });
            e.currentTarget.reset();
          }}
        >
          <input name="date" type="date" className="input" defaultValue={today()} required />
          <textarea name="body" className="input h-32" placeholder="Prescrição / condutas" required />
          <button className="btn-gold">Salvar</button>
          {recs.map((r) => (
            <Link key={r.id} to="/receitas" search={{ print: r.id }} className="block rounded-md border border-parchment p-3 text-sm">
              {r.date} — abrir receituário
            </Link>
          ))}
        </form>
      )}
    </Shell>
  );
}

function VisitForm({
  patientId,
  patientName,
  onSave,
}: {
  patientId: string;
  patientName: string;
  onSave: (visit: ClinicData["visits"][number], finance: ClinicData["finance"]) => void;
}) {
  const [items, setItems] = useState<VisitItem[]>([{ desc: "Consulta", kind: "consulta", charged: true, amount: 0 }]);
  return (
    <form
      className="card space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const visit = {
          id: uid("v"),
          patientId,
          date: String(fd.get("date")),
          type: String(fd.get("type")) as "primeira" | "retorno" | "encaixe",
          evolution: String(fd.get("evolution")),
          items,
        };
        const finance = items
          .filter((i) => i.charged && i.amount > 0)
          .map((i) => ({
            id: uid("f"),
            type: "entrada" as const,
            category: i.kind === "consulta" ? "Consulta" : "Procedimento",
            description: `${i.desc} — ${patientName}`,
            amount: i.amount,
            date: visit.date,
          }));
        onSave(visit, finance);
      }}
    >
      <h3 className="font-serif text-lg">Registrar atendimento</h3>
      <p className="text-xs text-taupe">Retorno pode ficar sem custo. Protocolo pode ser cobrado na hora.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input name="date" type="date" className="input" defaultValue={today()} required />
        <select name="type" className="input">
          <option value="primeira">Primeiro atendimento</option>
          <option value="retorno">Retorno</option>
          <option value="encaixe">Decisão na hora</option>
        </select>
      </div>
      <textarea name="evolution" className="input h-24" placeholder="Evolução clínica" />
      {items.map((it, i) => (
        <div key={i} className="grid gap-2 rounded-md border border-parchment p-2 sm:grid-cols-4">
          <input className="input sm:col-span-2" value={it.desc} onChange={(e) => setItems(items.map((x, idx) => (idx === i ? { ...x, desc: e.target.value } : x)))} />
          <input type="number" step="0.01" className="input" placeholder="Valor" value={it.amount || ""} onChange={(e) => setItems(items.map((x, idx) => (idx === i ? { ...x, amount: Number(e.target.value || 0) } : x)))} />
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={it.charged} onChange={(e) => setItems(items.map((x, idx) => (idx === i ? { ...x, charged: e.target.checked } : x)))} />
            Cobrar
          </label>
        </div>
      ))}
      <button type="button" className="text-sm text-gold-dark" onClick={() => setItems([...items, { desc: "", kind: "procedimento", charged: true, amount: 0 }])}>
        + procedimento
      </button>
      <button className="btn-gold">Salvar no prontuário</button>
    </form>
  );
}
