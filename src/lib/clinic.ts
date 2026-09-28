export type Role = "admin" | "secretaria" | "visualizacao";

export type Session = { username: string; name: string; role: Role };

export type Staff = { id: string; username: string; password: string; name: string; role: Role };

const STAFF = "lb-staff-v1";
const SEED_STAFF: Staff[] = [
  { id: "u_lorhany", username: "lorhany", password: "lorhany2026", name: "Enfª Lorhany Batista", role: "admin" },
  { id: "u_secretaria", username: "secretaria", password: "agenda2026", name: "Secretaria", role: "secretaria" },
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

export type RxItem = { name: string; dose: string; posology: string };

export type Rx = {
  id: string;
  patientId: string;
  date: string;
  body: string;
  use?: string;
  items?: RxItem[];
  notes?: string;
};

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

export function loadStaff(): Staff[] {
  if (typeof window === "undefined") return SEED_STAFF;
  try {
    const raw = localStorage.getItem(STAFF);
    if (!raw) {
      localStorage.setItem(STAFF, JSON.stringify(SEED_STAFF));
      return SEED_STAFF;
    }
    const list = JSON.parse(raw) as Staff[];
    return Array.isArray(list) && list.length ? list : SEED_STAFF;
  } catch {
    return SEED_STAFF;
  }
}

export function saveStaff(list: Staff[]) {
  localStorage.setItem(STAFF, JSON.stringify(list));
}

export function login(username: string, password: string): Session | null {
  const u = loadStaff().find((x) => x.username === username.trim().toLowerCase() && x.password === password);
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

export function saveData(data: ClinicData): string | null {
  try {
    localStorage.setItem(DATA, JSON.stringify(data));
    return null;
  } catch {
    return "Não deu para salvar. A memória do navegador encheu. Apague uma foto antiga.";
  }
}

export function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1100;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagem"));
    };
    img.src = url;
  });
}

export function withoutPatient(data: ClinicData, patientId: string): ClinicData {
  return {
    ...data,
    patients: data.patients.filter((p) => p.id !== patientId),
    appointments: data.appointments.filter((a) => a.patientId !== patientId),
    visits: data.visits.filter((v) => v.patientId !== patientId),
    budgets: data.budgets.filter((b) => b.patientId !== patientId),
    photos: data.photos.filter((p) => p.patientId !== patientId),
    prescriptions: data.prescriptions.filter((r) => r.patientId !== patientId),
  };
}
