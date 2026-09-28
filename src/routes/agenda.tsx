import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { brl, currentUser, loadData, saveData, today, uid, type Appointment, type ClinicData } from "@/lib/clinic";

export const Route = createFileRoute("/agenda")({ component: AgendaPage });

function AgendaPage() {
  const [data, setData] = useState<ClinicData | null>(null);
  const [date, setDate] = useState(today());
  const [open, setOpen] = useState(false);
  const [viewer, setViewer] = useState(false);
  useEffect(() => {
    setData(loadData());
    setViewer(currentUser()?.role === "visualizacao");
  }, []);
  const list = useMemo(
    () =>
      data
        ? data.appointments
            .filter((a) => a.date === date && a.status !== "cancelado" && data.patients.some((p) => p.id === a.patientId))
            .sort((a, b) => a.time.localeCompare(b.time))
        : [],
    [data, date],
  );
  if (!data) return null;

  function persist(next: ClinicData) {
    saveData(next);
    setData(next);
  }

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const appt: Appointment = {
      id: uid("a"),
      patientId: String(fd.get("patientId")),
      date: String(fd.get("date")),
      time: String(fd.get("time")),
      service: String(fd.get("service")),
      status: "agendado",
      value: Number(fd.get("value") || 0),
    };
    persist({ ...data!, appointments: [appt, ...data!.appointments] });
    setOpen(false);
  }

  function remove(id: string) {
    persist({ ...data!, appointments: data!.appointments.filter((a) => a.id !== id) });
  }

  function setStatus(id: string, status: Appointment["status"]) {
    const nextAppts = data!.appointments.map((a) => (a.id === id ? { ...a, status } : a));
    let finance = data!.finance;
    if (status === "concluido") {
      const a = data!.appointments.find((x) => x.id === id);
      if (a && a.value > 0 && !finance.some((f) => f.description.includes(a.id))) {
        const p = data!.patients.find((x) => x.id === a.patientId);
        finance = [{ id: uid("f"), type: "entrada", category: "Atendimento", description: `${a.service} — ${p?.name || ""} (${a.id})`, amount: a.value, date: a.date }, ...finance];
      }
    }
    persist({ ...data!, appointments: nextAppts, finance });
  }

  return (
    <Shell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-serif text-3xl">Agenda</h1>
        <div className="flex gap-2">
          <input type="date" className="input w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
          {!viewer && (
            <button className="btn-gold" onClick={() => setOpen(true)}>
              Novo horário
            </button>
          )}
        </div>
      </div>
      <div className="card list-scroll divide-y divide-parchment">
        {list.length === 0 && <p className="p-6 text-sm text-taupe">Nenhum horário neste dia.</p>}
        {list.map((a) => {
          const p = data.patients.find((x) => x.id === a.patientId);
          return (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="font-medium">
                  {a.time} · {p?.name || "Paciente"}
                </div>
                <div className="text-sm text-taupe">
                  {a.service} · {brl(a.value)} · {a.status}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {p && (
                  <Link to="/pacientes/$id" params={{ id: p.id }} search={{ aba: undefined }} className="text-gold-dark">
                    Ficha
                  </Link>
                )}
                {!viewer && a.status !== "concluido" && a.status !== "cancelado" && (
                  <>
                    <button className="btn-ghost !py-1" onClick={() => setStatus(a.id, "confirmado")}>
                      Confirmar
                    </button>
                    <button className="btn-gold !py-1" onClick={() => setStatus(a.id, "concluido")}>
                      Concluir
                    </button>
                  </>
                )}
                {!viewer && (
                  <button className="btn-ghost !py-1" onClick={() => remove(a.id)}>
                    Excluir
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {open && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/30 p-4">
          <form onSubmit={add} className="card w-full max-w-lg p-6">
            <h2 className="mb-4 font-serif text-xl">Novo atendimento</h2>
            <select name="patientId" className="input mb-3" required>
              <option value="">Paciente</option>
              {data.patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="date" type="date" className="input" defaultValue={date} required />
              <input name="time" type="time" className="input" required />
            </div>
            <input name="service" className="input my-3" placeholder="Serviço" required />
            <input name="value" type="number" step="0.01" className="input mb-4" placeholder="Valor" defaultValue={0} />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="btn-gold">Agendar</button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
