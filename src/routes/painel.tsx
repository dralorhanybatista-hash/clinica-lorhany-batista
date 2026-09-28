import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { brl, currentUser, loadData, today, type ClinicData } from "@/lib/clinic";

export const Route = createFileRoute("/painel")({ component: Painel });

function Painel() {
  const [data, setData] = useState<ClinicData | null>(null);
  const [admin, setAdmin] = useState(true);
  useEffect(() => {
    setData(loadData());
    setAdmin(currentUser()?.role !== "secretaria");
  }, []);
  if (!data) return null;
  const day = today();
  const todayAppts = data.appointments.filter((a) => a.date === day && a.status !== "cancelado");
  const month = day.slice(0, 7);
  const entradas = data.finance.filter((f) => f.type === "entrada" && f.date.startsWith(month)).reduce((s, f) => s + f.amount, 0);
  const saidas = data.finance.filter((f) => f.type === "saida" && f.date.startsWith(month)).reduce((s, f) => s + f.amount, 0);

  return (
    <Shell>
      <h1 className="mb-1 font-serif text-3xl">Painel</h1>
      <p className="mb-6 text-sm text-taupe">Visão geral da clínica</p>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Pacientes" value={String(data.patients.length)} href="/pacientes" />
        <Stat title="Agenda de hoje" value={String(todayAppts.length)} href="/agenda" />
        {admin ? (
          <>
            <Stat title="Entradas no mês" value={brl(entradas)} href="/financeiro" />
            <Stat title="Saídas no mês" value={brl(saidas)} href="/financeiro" />
          </>
        ) : (
          <>
            <Stat title="Receitas" value={String(data.prescriptions.length)} href="/receitas" />
            <Stat title="Orçamentos" value={String(data.budgets.length)} href="/pacientes" />
          </>
        )}
      </div>
      <section className="card p-5">
        <h2 className="mb-3 font-serif text-xl">Atendimentos de hoje</h2>
        {todayAppts.length === 0 && <p className="text-sm text-taupe">Nenhum atendimento para hoje.</p>}
        <ul className="divide-y divide-parchment">
          {todayAppts.map((a) => {
            const p = data.patients.find((x) => x.id === a.patientId);
            return (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium">
                    {a.time} · {p?.name || "Paciente"}
                  </div>
                  <div className="text-taupe">
                    {a.service} · {a.status}
                  </div>
                </div>
                {p && (
                  <Link to="/pacientes/$id" params={{ id: p.id }} search={{ aba: undefined }} className="text-gold-dark">
                    Ficha
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </Shell>
  );
}

function Stat({ title, value, href }: { title: string; value: string; href: string }) {
  return (
    <Link to={href} className="card p-4 transition hover:shadow-md">
      <div className="text-xs uppercase tracking-wide text-taupe">{title}</div>
      <div className="mt-1 font-serif text-2xl">{value}</div>
    </Link>
  );
}
