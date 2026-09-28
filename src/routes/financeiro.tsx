import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { brl, currentUser, loadData, saveData, today, uid, type ClinicData, type Finance } from "@/lib/clinic";

export const Route = createFileRoute("/financeiro")({ component: Financeiro });

function Financeiro() {
  const [data, setData] = useState<ClinicData | null>(null);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    if (currentUser()?.role !== "admin") setBlocked(true);
    else setData(loadData());
  }, []);
  if (blocked) {
    return (
      <Shell>
        <p className="card p-6">A secretaria não tem acesso ao financeiro.</p>
      </Shell>
    );
  }
  if (!data) return null;
  const month = today().slice(0, 7);
  const monthItems = data.finance.filter((f) => f.date.startsWith(month));
  const inSum = monthItems.filter((f) => f.type === "entrada").reduce((s, f) => s + f.amount, 0);
  const outSum = monthItems.filter((f) => f.type === "saida").reduce((s, f) => s + f.amount, 0);

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const entry: Finance = {
      id: uid("f"),
      type: fd.get("type") as "entrada" | "saida",
      category: String(fd.get("category")),
      description: String(fd.get("description")),
      amount: Number(fd.get("amount")),
      date: String(fd.get("date")),
    };
    const next = { ...data!, finance: [entry, ...data!.finance] };
    saveData(next);
    setData(next);
    e.currentTarget.reset();
  }

  return (
    <Shell>
      <h1 className="font-serif text-3xl">Financeiro</h1>
      <p className="mb-5 text-sm text-taupe">Somente a proprietária acessa esta área.</p>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card label="Entradas do mês" value={brl(inSum)} />
        <Card label="Saídas do mês" value={brl(outSum)} />
        <Card label="Saldo do mês" value={brl(inSum - outSum)} />
      </div>
      <form onSubmit={add} className="card mb-6 grid gap-3 p-4 md:grid-cols-5">
        <select name="type" className="input">
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
        <input name="category" className="input" placeholder="Categoria" required />
        <input name="description" className="input" placeholder="Descrição" required />
        <input name="amount" type="number" step="0.01" className="input" placeholder="Valor" required />
        <input name="date" type="date" className="input" defaultValue={today()} required />
        <button className="btn-gold md:col-span-5">Lançar</button>
      </form>
      <div className="card overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-xs uppercase text-taupe">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.finance.map((f) => (
              <tr key={f.id} className="border-t border-parchment">
                <td className="px-4 py-2">{f.date}</td>
                <td className="px-4 py-2">{f.type}</td>
                <td className="px-4 py-2">{f.description}</td>
                <td className={`px-4 py-2 text-right ${f.type === "saida" ? "text-red-800" : "text-sage"}`}>
                  {f.type === "saida" ? "−" : "+"}
                  {brl(f.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-taupe">{label}</div>
      <div className="mt-1 font-serif text-2xl">{value}</div>
    </div>
  );
}
