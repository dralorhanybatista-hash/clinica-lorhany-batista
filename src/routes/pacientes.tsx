import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { loadData, saveData, uid, currentUser, withoutPatient, type ClinicData, type Patient } from "@/lib/clinic";

export const Route = createFileRoute("/pacientes")({ component: PacientesPage });

function PacientesPage() {
  const [data, setData] = useState<ClinicData | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => setData(loadData()), []);
  if (!data) return null;
  const admin = currentUser()?.role === "admin";
  const list = data.patients.filter((p) => `${p.name} ${p.phone} ${p.cpf}`.toLowerCase().includes(q.toLowerCase()));

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p: Patient = {
      id: uid("p"),
      name: String(fd.get("name")),
      phone: String(fd.get("phone")),
      cpf: String(fd.get("cpf")),
      notes: String(fd.get("notes")),
    };
    const next = { ...data!, patients: [p, ...data!.patients] };
    saveData(next);
    setData(next);
    setOpen(false);
  }

  return (
    <Shell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Pacientes</h1>
          <p className="text-sm text-taupe">{data.patients.length} cadastros</p>
        </div>
        <button className="btn-gold" onClick={() => setOpen(true)}>
          Novo paciente
        </button>
      </div>
      <input className="input mb-4 max-w-md" placeholder="Buscar por nome, telefone ou CPF" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-wide text-taupe">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-parchment">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.phone}</td>
                <td className="px-4 py-3 text-right">
                  <Link to="/pacientes/$id" params={{ id: p.id }} search={{ aba: undefined }} className="mr-3 text-gold-dark">
                    Ficha
                  </Link>
                  <Link to="/pacientes/$id" params={{ id: p.id }} search={{ aba: "fotos" }} className="mr-3 text-gold-dark">
                    Fotos
                  </Link>
                  {admin && (
                    <button
                      className="text-red-800"
                      onClick={() => {
                        if (!confirm(`Excluir ${p.name}?`)) return;
                        const next = withoutPatient(data!, p.id);
                        saveData(next);
                        setData(next);
                      }}
                    >
                      Excluir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/30 p-4">
          <form onSubmit={add} className="card w-full max-w-lg p-6">
            <h2 className="mb-4 font-serif text-xl">Novo paciente</h2>
            <label className="label">Nome</label>
            <input name="name" className="input mb-3" required />
            <label className="label">Telefone</label>
            <input name="phone" className="input mb-3" />
            <label className="label">CPF</label>
            <input name="cpf" className="input mb-3" />
            <label className="label">Observações</label>
            <textarea name="notes" className="input mb-4 h-20" />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="btn-gold">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
