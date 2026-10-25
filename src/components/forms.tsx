"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export function ActionForm({
  action,
  children,
  className = "",
  submitLabel = "Salvar",
  hideSubmit = false,
  onSuccess,
}: {
  action: string;
  children?: React.ReactNode;
  className?: string;
  submitLabel?: string;
  hideSubmit?: boolean;
  onSuccess?: (data: Record<string, unknown>) => void;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false);
  const router = useRouter();
  return (
    <form
      className={"form " + className}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          const response = await fetch("/api/actions/" + action, {
            method: "POST",
            body: new FormData(e.currentTarget),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Falha na operação.");
          setError(false);
          if (onSuccess) onSuccess(data);
          if (data.redirect) {
            router.push(data.redirect);
            router.refresh();
          } else {
            setMessage(data.message || "Salvo.");
            router.refresh();
          }
        } catch (e) {
          setError(true);
          setMessage(e instanceof Error ? e.message : "Falha de conexão.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
      {!hideSubmit && (
        <button className="button" disabled={busy}>
          {busy ? "Aguarde…" : submitLabel}
        </button>
      )}
      {message && (
        <p
          className={error ? "notice error" : "notice success"}
          role={error ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </form>
  );
}
export function Field({
  label,
  name,
  type = "text",
  value = "",
  required = false,
  placeholder = "",
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  value?: string | number;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
      />
    </label>
  );
}
export function ThemeToggle() {
  return (
    <button
      className="icon-button"
      aria-label="Alternar tema claro e escuro"
      onClick={() => {
        const dark = document.documentElement.dataset.theme !== "dark";
        document.documentElement.dataset.theme = dark ? "dark" : "light";
        localStorage.setItem("edson-theme", dark ? "dark" : "light");
      }}
    >
      ◐
    </button>
  );
}
export function SearchBox({ compact = false }: { compact?: boolean }) {
  const [q, setQ] = useState(""),
    [items, setItems] = useState<{ title: string; url: string }[]>([]);
  const seq = useRef(0);
  return (
    <form
      className={"search " + (compact ? "compact" : "")}
      action="/busca"
      role="search"
    >
      <span aria-hidden="true">⌕</span>
      <label
        className="sr-only"
        htmlFor={compact ? "search-small" : "search-main"}
      >
        Buscar conteúdo técnico
      </label>
      <input
        id={compact ? "search-small" : "search-main"}
        name="q"
        placeholder="Peça, sintoma, veículo ou código OBD-II…"
        value={q}
        autoComplete="off"
        onChange={async (e) => {
          const value = e.target.value;
          setQ(value);
          const n = ++seq.current;
          if (value.length < 2) {
            setItems([]);
            return;
          }
          try {
            const r = await fetch("/api/search?q=" + encodeURIComponent(value));
            const data = await r.json();
            if (n === seq.current) setItems(data);
          } catch {
            setItems([]);
          }
        }}
      />
      <button aria-label="Pesquisar">
        Buscar <span>↗</span>
      </button>
      {items.length > 0 && (
        <div className="suggestions">
          {items.map((i) => (
            <Link key={i.url} href={i.url} onClick={() => setItems([])}>
              {i.title}
            </Link>
          ))}
        </div>
      )}
    </form>
  );
}
export function UploadForm({
  contents,
  lessons,
}: {
  contents: { id: string; title: string }[];
  lessons: { id: string; title: string }[];
}) {
  const [progress, setProgress] = useState(0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <form
      className="form card"
      onSubmit={async (e) => {
        e.preventDefault();
        setMessage("");
        setBusy(true);
        const f = new FormData(e.currentTarget);
        const file = f.get("file") as File;
        try {
          const sign = new FormData();
          sign.set("name", file.name);
          sign.set("type", file.type);
          sign.set("size", String(file.size));
          sign.set("contentId", String(f.get("contentId") || ""));
          sign.set("lessonId", String(f.get("lessonId") || ""));
          const r = await fetch("/api/actions/upload-sign", {
            method: "POST",
            body: sign,
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error);
          const body = new FormData();
          Object.entries(data.fields).forEach(([k, v]) =>
            body.append(k, String(v)),
          );
          body.append("file", file);
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", data.url);
            xhr.upload.onprogress = (ev) => {
              if (ev.lengthComputable)
                setProgress(Math.round((100 * ev.loaded) / ev.total));
            };
            xhr.onload = () =>
              xhr.status < 300
                ? resolve()
                : reject(
                    new Error(
                      "Falha no armazenamento. Verifique endpoint público e CORS.",
                    ),
                  );
            xhr.onerror = () =>
              reject(new Error("Não foi possível acessar o armazenamento."));
            xhr.send(body);
          });
          const end = new FormData();
          end.set("id", data.id);
          const finished = await fetch("/api/actions/upload-finish", {
            method: "POST",
            body: end,
          });
          const result = await finished.json();
          if (!finished.ok) throw new Error(result.error);
          setMessage(result.message);
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Falha no envio.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Enviar arquivo próprio</h2>
      <p>
        Vídeo MP4, WebM ou MOV, ou apostila PDF. Até 200 MB. Envie apenas
        material próprio ou autorizado.
      </p>
      <label>
        Vídeo cadastrado
        <select name="contentId">
          <option value="">Sem associação a vídeo</option>
          {contents.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Aula restrita (opcional)
        <select name="lessonId">
          <option value="">Sem associação a aula</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Arquivo
        <input
          name="file"
          type="file"
          accept="video/mp4,video/webm,video/quicktime,application/pdf"
          required
        />
      </label>
      <progress value={progress} max={100} aria-label="Progresso do envio" />
      <span>{progress}%</span>
      <button className="button" disabled={busy}>
        {busy ? "Enviando…" : "Enviar e processar"}
      </button>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </form>
  );
}
