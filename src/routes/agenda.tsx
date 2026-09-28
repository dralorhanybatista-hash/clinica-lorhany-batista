import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { brl, currentUser, loadData, saveData, today, uid, type Appointment, type ClinicData } from "@/lib/clinic";

export const Route = createFileRoute("/agenda")({ component: AgendaPage });

function showPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

function waLink(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}`;
}

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
            <div key={a.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="font-medium">
                  {a.time} · {p?.name || "Paciente"}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-taupe">
                  <span>{a.service}</span>
                  <span>{brl(a.value)}</span>
                  <span>{a.status}</span>
                </div>
                {p?.phone && (
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
                    <span className="text-ink">{showPhone(p.phone)}</span>
                    <a
                      href={waLink(p.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1 text-xs font-medium text-white"
                      title="Conversar no WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                        <path d="M20.5 3.5A11 11 0 0 0 2.1 17.2L1 23l5.9-1.1A11 11 0 0 0 20.5 3.5zm-8.5 17a9.1 9.1 0 0 1-4.6-1.3l-.3-.2-3.5.7.7-3.4-.2-.3A9.1 9.1 0 1 1 12 20.5zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.3a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.8 11.8 0 0 0 4.5 4 15 15 0 0 0 1.5.6 3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z" />
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                )}
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
