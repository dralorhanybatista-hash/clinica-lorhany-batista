import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { currentUser, loadStaff, saveStaff, uid, type Role, type Staff } from "@/lib/clinic";

export const Route = createFileRoute("/usuarios")({ component: UsuariosPage });

const LABEL: Record<Role, string> = {
  admin: "Administrador",
  secretaria: "Secretaria",
  visualizacao: "Somente visualização",
};

function UsuariosPage() {
  const [list, setList] = useState<Staff[] | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [msg, setMsg] = useState("");
  const me = currentUser();

  useEffect(() => {
    if (currentUser()?.role !== "admin") setBlocked(true);
    else setList(loadStaff());
  }, []);

  if (blocked) {
    return (
      <Shell>
        <p className="card p-6">Só a administração cria usuários.</p>
      </Shell>
    );
  }
  if (!list) return null;

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username")).trim().toLowerCase();
    const password = String(fd.get("password"));
    const name = String(fd.get("name")).trim();
    const role = String(fd.get("role")) as Role;
    if (list!.some((u) => u.username === username)) {
      setMsg("Esse usuário já existe.");
      return;
    }
    const next = [{ id: uid("u"), username, password, name, role }, ...list!];
    saveStaff(next);
    setList(next);
    setMsg("");
    e.currentTarget.reset();
  }

  function remove(id: string) {
    const target = list!.find((u) => u.id === id);
    if (!target) return;
    const admins = list!.filter((u) => u.role === "admin");
    if (target.role === "admin" && admins.length <= 1) {
      setMsg("Precisa ficar pelo menos uma administradora.");
      return;
    }
    if (target.username === me?.username) {
      setMsg("Você não pode apagar o próprio acesso.");
      return;
    }
    const next = list!.filter((u) => u.id !== id);
    saveStaff(next);
    setList(next);
  }

  return (
    <Shell>
      <h1 className="mb-1 font-serif text-3xl">Usuários</h1>
      <p className="mb-5 text-sm text-taupe">Crie administradoras, secretarias ou acessos só de visualização.</p>
      {msg && <p className="mb-3 text-sm text-red-800">{msg}</p>}
      <form onSubmit={add} className="card mb-6 grid gap-3 p-4 md:grid-cols-2">
        <label>
          <span className="label">Nome</span>
          <input name="name" className="input" required placeholder="Nome de quem vai entrar" />
        </label>
        <label>
          <span className="label">Usuário</span>
          <input name="username" className="input" required placeholder="sem espaço" autoComplete="off" />
        </label>
        <label>
          <span className="label">Senha</span>
          <input name="password" className="input" required minLength={4} autoComplete="new-password" />
        </label>
        <label>
          <span className="label">Tipo</span>
          <select name="role" className="input" defaultValue="secretaria">
            <option value="admin">Administrador</option>
            <option value="secretaria">Secretaria</option>
            <option value="visualizacao">Somente visualização</option>
          </select>
        </label>
        <button className="btn-gold md:col-span-2">Criar usuário</button>
      </form>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-wide text-taupe">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-t border-parchment">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3">{LABEL[u.role]}</td>
                <td className="px-4 py-3 text-right">
                  {u.username !== me?.username && (
                    <button className="text-red-800" onClick={() => remove(u.id)}>
                      Excluir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
