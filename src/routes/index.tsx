import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { currentUser, login } from "@/lib/clinic";

export const Route = createFileRoute("/")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (currentUser()) navigate({ to: "/painel" });
  }, [navigate]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const user = login(String(fd.get("username")), String(fd.get("password")));
    if (!user) {
      setError("Usuário ou senha inválidos.");
      return;
    }
    navigate({ to: "/painel" });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#efe8dc,transparent_55%),linear-gradient(#f7f3ec,#e8dfd0)] px-4 py-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-parchment md:grid-cols-2">
        <div className="relative min-h-[320px] bg-[#f6f1e8] md:min-h-[560px]">
          <video
            className="absolute inset-0 h-full w-full object-contain"
            src="/entrada.mp4"
            autoPlay
            muted
            loop
            playsInline
            poster="/logo.jpg"
          />
        </div>
        <form onSubmit={onSubmit} className="flex flex-col justify-center p-6 sm:p-8">
          <div className="mb-5 text-center">
            <h1 className="font-serif text-2xl tracking-[0.18em] text-gold-dark">LORHANY BATISTA</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.35em] text-taupe">Saúde e Estética</p>
          </div>
          <label className="label">Usuário</label>
          <input name="username" className="input mb-3" autoComplete="username" required />
          <label className="label">Senha</label>
          <input name="password" type={show ? "text" : "password"} className="input mb-2" autoComplete="current-password" required />
          <label className="mb-4 flex items-center gap-2 text-xs text-taupe">
            <input type="checkbox" onChange={(e) => setShow(e.target.checked)} />
            Mostrar senha
          </label>
          {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
          <button className="btn-gold w-full">Entrar</button>
          <p className="mt-4 text-center text-xs text-taupe">Acesso restrito à equipe da clínica.</p>
        </form>
      </div>
    </div>
  );
}
