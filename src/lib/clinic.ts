export type Role = "admin" | "secretaria";

export type Session = { username: string; name: string; role: Role };

const USERS = [
  { username: "lorhany", password: "lorhany2026", name: "Enfª Lorhany Batista", role: "admin" as const },
  { username: "secretaria", password: "agenda2026", name: "Secretaria", role: "secretaria" as const },
];

const SESSION = "lb-session";
const DATA = "lb-clinic-data-v2";

export type Patient = {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  notes: string;
  birth?: string;
  email?: string;
  address?: string;
  allergies?: string;
  medications?: string;
  complaints?: string;
  contraindication?: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  date: string;
  time: string;
  service: string;
  status: "agendado" | "confirmado" | "concluido" | "cancelado";
  value: number;
};

export type VisitItem = {
  desc: string;
  kind: "consulta" | "procedimento" | "protocolo" | "retorno";
  charged: boolean;
  amount: number;
};

export type Visit = {
  id: string;
  patientId: string;
  date: string;
  type: "primeira" | "retorno" | "encaixe";
  evolution: string;
  items: VisitItem[];
};

export type Budget = {
  id: string;
  patientId: string;
  date: string;
  desc: string;
  amount: number;
  status: "enviado" | "aprovado" | "recusado";
};

export type Photo = {
  id: string;
  patientId: string;
  kind: "antes" | "depois";
  area: string;
  dataUrl: string;
  date: string;
};

export type Rx = { id: string; patientId: string; date: string; body: string };

export type Finance = {
  id: string;
  type: "entrada" | "saida";
  category: string;
  description: string;
  amount: number;
  date: string;
};

export type ClinicData = {
  patients: Patient[];
  appointments: Appointment[];
  visits: Visit[];
  budgets: Budget[];
  photos: Photo[];
  prescriptions: Rx[];
  finance: Finance[];
};

export function uid(p = "id") {
  return `${p}_${Math.random().toString(36).slice(2, 9)}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function login(username: string, password: string): Session | null {
  const u = USERS.find((x) => x.username === username.trim().toLowerCase() && x.password === password);
  if (!u) return null;
  const session = { username: u.username, name: u.name, role: u.role };
  localStorage.setItem(SESSION, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION);
}

export function currentUser(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function empty(): ClinicData {
  return { patients: [], appointments: [], visits: [], budgets: [], photos: [], prescriptions: [], finance: [] };
}

export function loadData(): ClinicData {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(DATA);
    if (!raw) {
      const seed: ClinicData = {
        patients: [{ id: "p1", name: "Maria Clara Souza", phone: "(62) 99999-1111", cpf: "", notes: "Avaliação inicial." }],
        appointments: [{ id: "a1", patientId: "p1", date: today(), time: "09:00", service: "Avaliação inicial", status: "agendado", value: 350 }],
        visits: [],
        budgets: [],
        photos: [],
        prescriptions: [],
        finance: [
          { id: "f2", type: "saida", category: "Aluguel", description: "Sala Focus Business Center", amount: 2800, date: today() },
        ],
      };
      localStorage.setItem(DATA, JSON.stringify(seed));
      return seed;
    }
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

export function saveData(data: ClinicData) {
  localStorage.setItem(DATA, JSON.stringify(data));
}
