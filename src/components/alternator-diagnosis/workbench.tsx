"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  symptoms,
  stages,
  inspections,
  checkStates,
  measures,
  componentDiagnostics,
  dtcs,
  safety,
  references,
  tools,
  glossary,
} from "@/lib/alternator-diagnosis/content";
import {
  caseSchema,
  emptyCase,
  applicationKey,
  referenceUsable,
  type DiagnosticCase,
  type TechnicalEntry,
} from "@/lib/alternator-diagnosis/schema";
import {
  evaluate,
  interpretMeasurements,
  nextDecision,
  reportReady,
  selectedSequence,
} from "@/lib/alternator-diagnosis/rules";
import { reportText } from "@/lib/alternator-diagnosis/report";
import { alternatorPartArtwork } from "@/lib/alternator-reference-catalog";
import { visualArtworkStyle } from "@/lib/visual-reference-catalog";
import { AlternatorExplorer } from "@/components/alternator-explorer";
import { Circuit, MeasurementChart, ScopeLesson } from "./charts";
const tabs = [
  "Visão Geral",
  "Sintomas",
  "Diagnóstico Guiado",
  "Testes Elétricos",
  "Osciloscópio",
  "Componentes",
  "Códigos de Falha",
  "Resultado",
  "Relatório",
];
const labels: Record<string, string> = {
  make: "Montadora",
  model: "Modelo",
  yearVersion: "Ano e versão",
  engine: "Motorização",
  fuel: "Combustível",
  otherVoltage: "Outra arquitetura elétrica",
  batteryAh: "Capacidade da bateria (Ah)",
  batteryCca: "Corrente nominal da bateria (A e norma no histórico)",
  alternatorAmps: "Corrente nominal do alternador (A)",
  partCode: "Código da peça",
  km: "Quilometragem",
  history: "Histórico recente de manutenção",
  complaint: "Sintoma informado pelo proprietário",
  plate: "Placa (opcional)",
  technician: "Técnico responsável",
};
const shortFields = [
  "make",
  "model",
  "yearVersion",
  "engine",
  "fuel",
  "partCode",
  "alternatorAmps",
  "batteryAh",
  "batteryCca",
  "km",
  "plate",
  "technician",
] as const;
const normalize = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Serviço indisponível.");
  return body;
}
function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function AlternatorDiagnosis({
  initialComponent = 5,
  showComponent = false,
}: { initialComponent?: number; showComponent?: boolean } = {}) {
  const [data, setData] = useState<DiagnosticCase>(emptyCase),
    [tab, setTab] = useState(showComponent ? 5 : 0),
    [step, setStep] = useState(0),
    [mode, setMode] = useState("Aprendiz"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(initialComponent),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [record, setRecord] = useState<{
      id: string;
      revision: number;
      createdAt: string;
    } | null>(null),
    [cases, setCases] = useState<
      { id: string; make: string; model: string; updatedAt: string }[]
    >([]),
    [entries, setEntries] = useState<{ id: string; data: TechnicalEntry }[]>(
      [],
    ),
    [referenceMessage, setReferenceMessage] = useState(
      "Carregando referências por aplicação…",
    ),
    [stamp, setStamp] = useState(""),
    [draftNumber, setDraftNumber] = useState("Rascunho não salvo"),
    [pendingDelete, setPendingDelete] = useState(false);
  const importer = useRef<HTMLInputElement>(null),
    report = useRef<HTMLPreElement>(null);
  const select = useCallback((id: number) => setSelected(id), []);
  useEffect(() => {
    let active = true;
    request("/api/diagnostics/alternator/references")
      .then((body) => {
        if (active) {
          setEntries(body.entries);
          setReferenceMessage(
            body.entries.length
              ? "Referências cadastradas disponíveis."
              : "Nenhuma referência específica cadastrada. Valor de referência do fabricante não confirmado.",
          );
        }
      })
      .catch(() => {
        if (active)
          setReferenceMessage(
            "Referências específicas indisponíveis. Os conteúdos gerais continuam acessíveis; tente recarregar a página.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  const readings = interpretMeasurements(data),
    hypotheses = evaluate(data),
    component = componentDiagnostics[selected - 1],
    issue = reportReady(data);
  const update = (patch: Partial<DiagnosticCase>) =>
    setData((current) => ({ ...current, ...patch }));
  function vehicle(key: keyof DiagnosticCase["vehicle"], value: string) {
    setData((current) => ({
      ...current,
      vehicle: { ...current.vehicle, [key]: value },
    }));
  }
  function check(key: string, status: string, note?: string) {
    setData((current) => ({
      ...current,
      checks: {
        ...current.checks,
        [key]: {
          status: status as (typeof checkStates)[number],
          note: note ?? current.checks[key]?.note ?? "",
        },
      },
    }));
  }
  function valid() {
    const parsed = caseSchema.safeParse(data);
    if (!parsed.success) {
      setMessage(
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("\n"),
      );
      return false;
    }
    if (issue) {
      setMessage(issue);
      return false;
    }
    return true;
  }
  async function task(fn: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Operação não concluída.");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!valid()) return;
    await task(async () => {
      const body = await request("/api/diagnostics/alternator", {
        method: record ? "PUT" : "POST",
        body: JSON.stringify({
          ...(record ? { id: record.id, revision: record.revision } : {}),
          data,
        }),
      });
      setRecord(body);
      setMessage("Diagnóstico salvo na sua conta.");
    });
  }
  async function list() {
    await task(async () => {
      const body = await request("/api/diagnostics/alternator");
      setCases(body.cases);
      setMessage(
        body.cases.length
          ? "Escolha um diagnóstico para retomar."
          : "Nenhum diagnóstico salvo nesta conta.",
      );
    });
  }
  async function load(id: string) {
    await task(async () => {
      const body = await request(
        "/api/diagnostics/alternator?id=" + encodeURIComponent(id),
      );
      setData(caseSchema.parse(body.data));
      setRecord(body);
      setStamp("");
      setMessage("Diagnóstico retomado.");
    });
  }
  function openComponent(id: number) {
    setSelected(id);
    setTab(5);
  }
  function measured(key: string) {
    const item = measures.find((m) => m[0] === key)!;
    const r = readings.find((m) => m.id === key)!;
    return (
      <div className="ad-reading" key={key}>
        <label>
          {item[1]} ({key === "ripple" ? data.rippleUnit : item[2]})
          <input
            inputMode="decimal"
            value={data.measurements[key] || ""}
            onChange={(e) =>
              update({
                measurements: { ...data.measurements, [key]: e.target.value },
              })
            }
          />
        </label>
        <details>
          <summary>Referência deste teste</summary>
          <div className="ad-grid">
            <label>
              Mínimo ({item[2]})
              <input
                inputMode="decimal"
                value={data.limits[key]?.min || ""}
                onChange={(e) =>
                  update({
                    limits: {
                      ...data.limits,
                      [key]: {
                        min: e.target.value,
                        max: data.limits[key]?.max || "",
                      },
                    },
                    reference: {
                      ...data.reference,
                      origin: "technician",
                      entryId: "",
                    },
                  })
                }
              />
            </label>
            <label>
              Máximo ({item[2]})
              <input
                inputMode="decimal"
                value={data.limits[key]?.max || ""}
                onChange={(e) =>
                  update({
                    limits: {
                      ...data.limits,
                      [key]: {
                        max: e.target.value,
                        min: data.limits[key]?.min || "",
                      },
                    },
                    reference: {
                      ...data.reference,
                      origin: "technician",
                      entryId: "",
                    },
                  })
                }
              />
            </label>
          </div>
          <p>
            Preencher conforme a aplicação e o método. Ripple informado em mV é
            convertido para V antes de comparar com limites em V.
          </p>
        </details>
        <strong>{r.state}</strong>
        <p>{r.interpretation}</p>
        <p>Próxima verificação: {r.next}</p>
        <p>Evidência faltante: {r.missing}</p>
      </div>
    );
  }
  function checklist(keys: readonly string[]) {
    return keys.map((key) => {
      const label = inspections.find((i) => i[0] === key)?.[1] || key;
      return (
        <fieldset key={key}>
          <legend>{label}</legend>
          <label>
            Resultado
            <select
              value={data.checks[key]?.status || "não testado"}
              onChange={(e) => check(key, e.target.value)}
            >
              {checkStates.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Evidência, método e observação
            <textarea
              value={data.checks[key]?.note || ""}
              onChange={(e) =>
                check(
                  key,
                  data.checks[key]?.status || "não testado",
                  e.target.value,
                )
              }
            />
          </label>
        </fieldset>
      );
    });
  }
  function generate() {
    if (!valid()) return null;
    const date = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Fortaleza",
    });
    setStamp(date);
    const number =
      record?.id ||
      (draftNumber === "Rascunho não salvo"
        ? "EO-" + crypto.randomUUID()
        : draftNumber);
    setDraftNumber(number);
    return reportText(data, number, date);
  }
  async function exportPdf() {
    const text = generate();
    if (!text) return;
    await task(async () => {
      const { PDFDocument, StandardFonts } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      let page = doc.addPage([595, 842]),
        y = 800;
      const safe = Array.from(text)
        .map((char) => {
          if (char === "\n") return char;
          try {
            font.encodeText(char);
            return char;
          } catch {
            return "-";
          }
        })
        .join("");
      const lines: string[] = [];
      for (const line of safe.split("\n")) {
        let chunk = "";
        for (const char of line) {
          if (font.widthOfTextAtSize(chunk + char, 9) > 510) {
            lines.push(chunk);
            chunk = "";
          }
          chunk += char;
        }
        lines.push(chunk || " ");
      }
      for (const chunk of lines) {
        if (y < 45) {
          page = doc.addPage([595, 842]);
          y = 800;
        }
        page.drawText(chunk, { x: 40, y, size: 9, font });
        y -= 14;
      }
      download(
        "diagnostico-alternador.pdf",
        new Blob([new Uint8Array(await doc.save())], {
          type: "application/pdf",
        }),
      );
      setMessage("PDF exportado com os registros informados.");
    });
  }
  return (
    <section className="alternator-diagnosis" aria-labelledby="ad-title">
      <header className="ad-hero">
        <span className="eyebrow">EDSON OFICINA / CENTRAL TÉCNICA</span>
        <h1 id="ad-title">Diagnóstico avançado do alternador</h1>
        <p>
          Investigue o sistema de carga, registre medições e confirme a causa
          com evidências.
        </p>
        <div className="ad-actions">
          <Link href="/artigos?catalog=alternador">Catálogo ilustrado ↗</Link>
          <Link href="/categorias/alternador">Alternador 3D e vídeos ↗</Link>
          <Link href="/diagnostico">Todos os diagnósticos ↗</Link>
        </div>
        <label>
          Nível de orientação
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option>Aprendiz</option>
            <option>Profissional</option>
          </select>
        </label>
      </header>
      <details className="ad-safety">
        <summary>Cuidados obrigatórios antes de medir</summary>
        <ul>
          {safety.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </details>
      <div className="ad-actions">
        <button disabled={busy} onClick={save}>
          Salvar na conta
        </button>
        <button disabled={busy} onClick={list}>
          Retomar diagnóstico
        </button>
        <button
          onClick={() => {
            if (valid()) {
              sessionStorage.setItem(
                "edson-alternator-draft",
                JSON.stringify(data),
              );
              setMessage(
                "Rascunho salvo nesta aba. Dados de veículo permanecem neste navegador até fechar a sessão ou remover.",
              );
            }
          }}
        >
          Salvar rascunho nesta aba
        </button>
        <button
          onClick={() => {
            try {
              const raw = sessionStorage.getItem("edson-alternator-draft");
              if (!raw) throw new Error("Nenhum rascunho nesta aba.");
              setData(caseSchema.parse(JSON.parse(raw)));
              setRecord(null);
              setMessage("Rascunho retomado.");
            } catch {
              setMessage("Rascunho ausente ou incompatível.");
            }
          }}
        >
          Retomar rascunho da aba
        </button>
        <button
          onClick={() => {
            sessionStorage.removeItem("edson-alternator-draft");
            setMessage("Rascunho local removido.");
          }}
        >
          Remover rascunho local
        </button>
      </div>
      <p>
        Salvar e retomar na conta exige login. Rascunhos locais são opcionais.{" "}
        <Link href="/login">Entrar na conta ↗</Link>
      </p>
      {message && (
        <p className="ad-message" role="status">
          {message}
        </p>
      )}
      {busy && <p role="status">Processando…</p>}
      {cases.length > 0 && (
        <ul>
          {cases.map((c) => (
            <li key={c.id}>
              <button disabled={busy} onClick={() => load(c.id)}>
                {c.make} {c.model} ·{" "}
                {new Date(c.updatedAt).toLocaleDateString("pt-BR", {
                  timeZone: "America/Fortaleza",
                })}{" "}
                · {c.id}
              </button>
            </li>
          ))}
        </ul>
      )}
      <nav className="ad-tabs" aria-label="Etapas e recursos do diagnóstico">
        {tabs.map((name, i) => (
          <button
            key={name}
            aria-current={tab === i ? "page" : undefined}
            onClick={() => setTab(i)}
          >
            {name}
          </button>
        ))}
      </nav>
      <div className="ad-panel">
        <h2>{tabs[tab]}</h2>
        {tab === 0 && (
          <>
            <p>
              Identifique aplicação, ano, versão, motor e código da peça antes
              de adotar valores. A marca sozinha não identifica o sistema.
            </p>
            <div className="ad-grid">
              {shortFields.map((key) => (
                <label key={key}>
                  {labels[key]}
                  <input
                    maxLength={200}
                    value={data.vehicle[key]}
                    onChange={(e) => vehicle(key, e.target.value)}
                  />
                </label>
              ))}
              <label>
                Sistema elétrico
                <select
                  value={data.vehicle.voltage}
                  onChange={(e) => vehicle("voltage", e.target.value)}
                >
                  <option value="12">12 V</option>
                  <option value="24">24 V</option>
                  <option value="other">Outra arquitetura</option>
                </select>
              </label>
              {data.vehicle.voltage === "other" && (
                <label>
                  Outra arquitetura elétrica
                  <input
                    value={data.vehicle.otherVoltage}
                    onChange={(e) => vehicle("otherVoltage", e.target.value)}
                  />
                </label>
              )}
              <label>
                Tipo de bateria
                <select
                  value={data.vehicle.battery}
                  onChange={(e) => vehicle("battery", e.target.value)}
                >
                  {["desconhecida", "convencional", "EFB", "AGM"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Gerenciamento
                <select
                  value={data.vehicle.management}
                  onChange={(e) => vehicle("management", e.target.value)}
                >
                  {[
                    "desconhecido",
                    "convencional",
                    "PWM",
                    "LIN",
                    "BSS",
                    "GENCOM/GENMON",
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            </div>
            {(["history", "complaint"] as const).map((key) => (
              <label key={key}>
                {labels[key]}
                <textarea
                  value={data.vehicle[key]}
                  onChange={(e) => vehicle(key, e.target.value)}
                />
              </label>
            ))}
            <h3>Referência por aplicação</h3>
            <p>{referenceMessage}</p>
            <label>
              Aplicações cadastradas (edição administrativa)
              <select
                defaultValue=""
                onChange={(e) => {
                  const entry = entries.find((v) => v.id === e.target.value);
                  if (entry?.data.vehicle && entry.data.limits) {
                    update({
                      vehicle: {
                        ...entry.data.vehicle,
                        plate: data.vehicle.plate,
                        km: data.vehicle.km,
                        history: data.vehicle.history,
                        complaint: data.vehicle.complaint,
                        technician: data.vehicle.technician,
                      },
                      limits: entry.data.limits,
                      referenceRippleMethod:
                        entry.data.rippleMethod || "unknown",
                      reference: {
                        title: entry.data.sourceTitle,
                        url: entry.data.sourceUrl,
                        date: entry.data.sourceDate,
                        application: applicationKey(entry.data.vehicle),
                        origin: "admin",
                        entryId: entry.id,
                      },
                    });
                  }
                }}
              >
                <option value="">
                  Escolha uma aplicação confirmada no cadastro
                </option>
                {entries
                  .filter((e) => e.data.kind === "variant")
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.data.title} · {e.data.application}
                    </option>
                  ))}
              </select>
            </label>
            <p>
              Selecionar aplicação substitui a identificação e os limites do
              rascunho. Confira o código antes de continuar.
            </p>
            {(["title", "url", "date"] as const).map((key) => (
              <label key={key}>
                {
                  {
                    title: "Documento técnico / título",
                    url: "Link HTTPS da referência",
                    date: "Data / revisão (se disponível)",
                  }[key]
                }
                <input
                  value={data.reference[key]}
                  onChange={(e) =>
                    update({
                      reference: {
                        ...data.reference,
                        [key]: e.target.value,
                        origin: "technician",
                        entryId: "",
                      },
                    })
                  }
                />
              </label>
            ))}
            <button
              onClick={() =>
                update({
                  reference: {
                    ...data.reference,
                    application: applicationKey(data.vehicle),
                    origin: "technician",
                    entryId: "",
                  },
                })
              }
            >
              Associar referência informada à identificação atual
            </button>
            <p>
              {referenceUsable(data)
                ? "Referência associada ao veículo e código informados. Confira procedimento e limites."
                : "Valor de referência do fabricante não confirmado"}
            </p>
            <p>
              Referências digitadas são informações do técnico, sem alterar o
              cadastro administrativo. Mudar veículo, código ou arquitetura
              invalida a associação anterior.
            </p>
            <details>
              <summary>Ferramentas da oficina</summary>
              <div className="ad-grid">
                {tools.map((tool) => (
                  <article key={tool.id}>
                    <svg
                      viewBox="0 0 220 90"
                      role="img"
                      aria-label={`Esquema de instrumento: ${tool.name}`}
                    >
                      <rect
                        x="55"
                        y="10"
                        width="110"
                        height="65"
                        rx="12"
                        fill="#243e58"
                        stroke="#f7cb55"
                      />
                      <rect
                        x="70"
                        y="20"
                        width="80"
                        height="25"
                        rx="3"
                        fill="#9ac6bf"
                      />
                      <circle cx="110" cy="60" r="8" fill="#f7cb55" />
                      <path
                        d="M70 75Q30 90 25 45 M150 75Q200 90 195 45"
                        fill="none"
                        stroke="#db7f6d"
                      />
                    </svg>
                    <h4>{tool.name}</h4>
                    <p>{tool.purpose}</p>
                    <p>{tool.connection}</p>
                    <small>Esquema didático do instrumento.</small>
                  </article>
                ))}
              </div>
            </details>
            <details>
              <summary>Glossário</summary>
              <dl>
                {glossary.map(([name, meaning]) => (
                  <div key={name}>
                    <dt>{name}</dt>
                    <dd>{meaning}</dd>
                  </div>
                ))}
              </dl>
            </details>
            <h3>Fontes e aplicabilidade</h3>
            {references.map((ref) => (
              <p key={ref.id}>
                <a href={ref.url} target="_blank" rel="noopener noreferrer">
                  {ref.title} ↗
                </a>{" "}
                · {ref.applicability} Data da publicação:{" "}
                {ref.date || "não informada"}. Referência geral; localizar
                documentação específica.
              </p>
            ))}
            <h3>Conteúdo técnico cadastrado</h3>
            {entries
              .filter((e) => e.data.kind !== "variant")
              .map((e) => (
                <article key={e.id}>
                  <h4>{e.data.title}</h4>
                  <p>{e.data.body}</p>
                  {e.data.url && (
                    <a
                      href={e.data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir material ↗
                    </a>
                  )}
                  <p>
                    Aplicação: {e.data.application} ·{" "}
                    <a
                      href={e.data.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {e.data.sourceTitle}
                    </a>{" "}
                    · {e.data.sourceDate || "Data não informada"}
                  </p>
                </article>
              ))}
            <button onClick={() => setTab(1)}>Iniciar pelos sintomas →</button>
          </>
        )}
        {tab === 1 && (
          <>
            <label>
              Pesquisar sintoma
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="ad-grid">
              {symptoms
                .filter((s) => normalize(s.name).includes(normalize(query)))
                .map((s) => (
                  <article key={s.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={data.symptoms.includes(s.id)}
                        onChange={(e) =>
                          update({
                            symptoms: e.target.checked
                              ? [...data.symptoms, s.id]
                              : data.symptoms.filter((id) => id !== s.id),
                          })
                        }
                      />
                      {s.name}
                    </label>
                    <details>
                      <summary>Investigar este sintoma</summary>
                      <p>{s.description}</p>
                      <p>
                        Possíveis causas associadas: {s.causes.join(", ")};
                        verificar também bateria, acionamento e circuitos.
                      </p>
                      <p>Ferramentas: {s.tools}</p>
                      <p>Resultado esperado: {s.expected}</p>
                      <p>{s.interpretation}</p>
                      <p>
                        Próximo teste:{" "}
                        {inspections.find((i) => i[0] === s.next)?.[1]}
                      </p>
                      <ul>
                        {s.checks.map((k) => (
                          <li key={k}>
                            {inspections.find((i) => i[0] === k)?.[1]} —
                            registrar evidência de aprovação/reprovação com
                            procedimento da aplicação.
                          </li>
                        ))}
                      </ul>
                      {s.components.map((n) => (
                        <button key={n} onClick={() => openComponent(n)}>
                          {componentDiagnostics[n - 1].name}
                        </button>
                      ))}
                    </details>
                  </article>
                ))}
            </div>
            <h3>Sequência recomendada pelos sintomas</h3>
            <ol>
              {selectedSequence(data).map((k) => (
                <li key={k}>{inspections.find((i) => i[0] === k)?.[1]}</li>
              ))}
            </ol>
            <button
              onClick={() => {
                setStep(0);
                setTab(2);
              }}
            >
              Abrir diagnóstico guiado →
            </button>
          </>
        )}
        {tab === 2 && (
          <>
            <p>
              {step + 1} / {stages.length} · Verificações com resultado:{" "}
              {
                Object.values(data.checks).filter(
                  (c) => c.status !== "não testado" && c.status !== "não sei",
                ).length
              }
              /{inspections.length}
            </p>
            <nav className="ad-steps" aria-label="Etapas do assistente">
              {stages.map((s, i) => (
                <button
                  aria-current={step === i ? "step" : undefined}
                  key={s.name}
                  onClick={() => setStep(i)}
                >
                  {i + 1}. {s.name}
                  {s.checks.length > 0 &&
                  s.checks.every(
                    (k) =>
                      data.checks[k] &&
                      data.checks[k].status !== "não testado" &&
                      data.checks[k].status !== "não sei",
                  )
                    ? " · registrada"
                    : ""}
                </button>
              ))}
            </nav>
            <h3>{stages[step].name}</h3>
            {mode === "Aprendiz" && <p>{stages[step].learn}</p>}
            <p>{stages[step].procedure}</p>
            <label>
              Condições de medição / procedimento utilizado
              <textarea
                value={data.conditions}
                onChange={(e) => update({ conditions: e.target.value })}
              />
            </label>
            <label>
              Consumidores acionados
              <textarea
                value={data.consumers}
                onChange={(e) => update({ consumers: e.target.value })}
              />
            </label>
            {checklist(stages[step].checks)}
            <div className="ad-grid">{stages[step].fields.map(measured)}</div>
            {[3, 4].includes(step) && <Circuit />}
            {step === 6 && <ScopeLesson />}
            {step === 7 && (
              <>
                <p>
                  Arquitetura informada: {data.vehicle.management}. Se
                  desconhecida, confirmar diagrama antes dos testes. Registre
                  DTCs e freeze frame na aba específica.
                </p>
                <label>
                  Considere LIN/PWM, BSS, GENCOM/GENMON: observações de sinal e
                  configuração
                  <textarea
                    value={data.scopeSettings}
                    onChange={(e) => update({ scopeSettings: e.target.value })}
                  />
                </label>
              </>
            )}
            <div className="ad-message">
              <strong>Próxima verificação</strong>
              <p>{nextDecision(data)}</p>
            </div>
            <div className="ad-actions">
              <button
                disabled={step === 0}
                onClick={() => setStep((v) => v - 1)}
              >
                ← Etapa anterior
              </button>
              <button
                onClick={() => (step === 7 ? setTab(7) : setStep((v) => v + 1))}
              >
                {step === 7 ? "Ver resultado →" : "Próxima etapa →"}
              </button>
            </div>
          </>
        )}
        {tab === 3 && (
          <>
            <Circuit />
            <label>
              Condições de medição
              <textarea
                value={data.conditions}
                onChange={(e) => update({ conditions: e.target.value })}
              />
            </label>
            <label>
              Consumidores acionados
              <textarea
                value={data.consumers}
                onChange={(e) => update({ consumers: e.target.value })}
              />
            </label>
            <div className="ad-grid">
              {measures.map(([key]) => measured(key))}
            </div>
            <MeasurementChart data={data} />
            <p>
              Limites sem referência específica, com método incompatível ou sem
              condições não classificam a medição.
            </p>
          </>
        )}
        {tab === 4 && (
          <>
            <ScopeLesson />
            <label>
              Método de ripple medido
              <select
                value={data.rippleMethod}
                onChange={(e) =>
                  update({
                    rippleMethod: e.target
                      .value as DiagnosticCase["rippleMethod"],
                  })
                }
              >
                <option value="unknown">Não confirmado</option>
                <option value="scope-pp">Osciloscópio — pico a pico</option>
                <option value="meter-rms">Multímetro — AC RMS</option>
              </select>
            </label>
            <label>
              Unidade da ondulação medida
              <select
                value={data.rippleUnit}
                onChange={(e) =>
                  update({ rippleUnit: e.target.value as "V" | "mV" })
                }
              >
                <option>V</option>
                <option>mV</option>
              </select>
            </label>
            <label>
              Método da referência
              <select
                value={data.referenceRippleMethod}
                onChange={(e) =>
                  update({
                    referenceRippleMethod: e.target
                      .value as DiagnosticCase["referenceRippleMethod"],
                    reference: {
                      ...data.reference,
                      origin: "technician",
                      entryId: "",
                    },
                  })
                }
              >
                <option value="unknown">Não confirmado</option>
                <option value="scope-pp">Osciloscópio — pico a pico</option>
                <option value="meter-rms">Multímetro — AC RMS</option>
              </select>
            </label>
            <label>
              Sonda, acoplamento, escala, base de tempo, ponto de massa e
              observações
              <textarea
                value={data.scopeSettings}
                onChange={(e) => update({ scopeSettings: e.target.value })}
              />
            </label>
            {measured("ripple")}
            <p>
              Para uma série de corrente, registre amostras reais em ensaio
              apropriado. O alicate mostra corrente nas condições informadas,
              não capacidade máxima automática.
            </p>
          </>
        )}
        {tab === 5 && (
          <>
            <label>
              Pesquisar peça
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="ad-component-buttons">
              {componentDiagnostics
                .filter((c) =>
                  normalize(`${c.number} ${c.name} ${c.procedure}`).includes(
                    normalize(query),
                  ),
                )
                .map((c) => (
                  <button
                    key={c.number}
                    aria-pressed={selected === c.number}
                    onClick={() => setSelected(c.number)}
                  >
                    {c.number}. {c.name}
                  </button>
                ))}
            </div>
            <AlternatorExplorer selectedPart={selected} onPartSelect={select} />
            <article>
              <div
                className="ad-part-image"
                role="img"
                aria-label={`Referência ilustrada: ${component.name}`}
                style={visualArtworkStyle(
                  alternatorPartArtwork,
                  component.imageCell,
                )}
              />
              <h3>
                {component.number}. {component.name}
              </h3>
              <dl>
                {Object.entries({
                  Localização: component.location,
                  Função: component.description,
                  Princípio: component.principle,
                  "Possíveis falhas": component.failures,
                  "Sintomas associados":
                    component.symptoms.join("; ") ||
                    "Relacionar à inspeção e ao sintoma registrado.",
                  Ferramentas: component.tools,
                  "Procedimento e testes": component.procedure,
                  "Resultados esperados": component.expected,
                  "Reparo ou substituição": component.criterion,
                }).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <button
                onClick={() => {
                  setStep(
                    [1, 2, 3, 4, 10, 11, 13, 14, 15, 16].includes(selected)
                      ? 0
                      : 6,
                  );
                  setTab(2);
                  setMessage(
                    `Investigação de ${component.name}: confirme condições e procedimentos da aplicação.`,
                  );
                }}
              >
                Diagnosticar este componente
              </button>
            </article>
          </>
        )}
        {tab === 6 && (
          <>
            <label>
              DTCs encontrados (separados por espaço ou vírgula)
              <input
                value={data.dtcs}
                onChange={(e) => update({ dtcs: e.target.value.toUpperCase() })}
              />
            </label>
            <label>
              Módulo de origem
              <input
                value={data.module}
                onChange={(e) => update({ module: e.target.value })}
              />
            </label>
            <label>
              Freeze frame / condições de ocorrência
              <textarea
                value={data.freezeFrame}
                onChange={(e) => update({ freezeFrame: e.target.value })}
              />
            </label>
            <label>
              Pesquisar código ou descrição
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            {dtcs
              .filter((d) =>
                normalize(d.code + " " + d.description).includes(
                  normalize(query),
                ),
              )
              .map((d) => (
                <details key={d.code}>
                  <summary>
                    {d.code} — {d.description}
                  </summary>
                  <p>
                    Descrição genérica OBD; valor e condições da aplicação não
                    confirmados nesta biblioteca.
                  </p>
                  <p>
                    {d.system}. {d.conditions}
                  </p>
                  <p>Causas: {d.causes}</p>
                  <p>Testes: {d.tests}</p>
                  <p>{d.confirmation}</p>
                  {d.components.map((n) => (
                    <button key={n} onClick={() => openComponent(n)}>
                      {componentDiagnostics[n - 1].name}
                    </button>
                  ))}
                  <a
                    href={references.find((r) => r.id === d.source)?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Consultar SAE J2012 e documentação da montadora ↗
                  </a>
                </details>
              ))}
          </>
        )}
        {tab === 7 && (
          <>
            <div className="ad-message">
              <h3>Próxima verificação</h3>
              <p>{nextDecision(data)}</p>
            </div>
            {hypotheses.map((h) => (
              <details key={h.id}>
                <summary>
                  {h.name} · {h.state}
                </summary>
                <p>Grau de certeza: {h.state}. Sem probabilidades numéricas.</p>
                <p>
                  Sintomas relacionados:{" "}
                  {h.related
                    .map((id) => symptoms.find((s) => s.id === id)?.name)
                    .join("; ") || "Não selecionados."}
                </p>
                <p>
                  Evidências favoráveis:{" "}
                  {h.favors.join("; ") || "Nenhuma registrada."}
                </p>
                <p>
                  Evidências contrárias:{" "}
                  {h.against.join("; ") || "Nenhuma registrada."}
                </p>
                <p>
                  Testes obrigatórios:{" "}
                  {h.required
                    .map((k) => inspections.find((i) => i[0] === k)?.[1])
                    .join("; ")}
                </p>
                <p>
                  Testes complementares:{" "}
                  {h.optional
                    .map((k) => inspections.find((i) => i[0] === k)?.[1])
                    .join("; ")}
                </p>
                <p>Confirmação: {h.confirmation}</p>
                <p>Descarte: {h.discard}</p>
                <p>
                  Evidência faltante:{" "}
                  {h.missing.join("; ") ||
                    "Conferir repetibilidade nas condições do sintoma."}
                </p>
                <a
                  href={references.find((r) => r.id === h.source)?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Referência técnica geral ↗
                </a>
              </details>
            ))}
            <button onClick={() => setTab(8)}>Preparar relatório →</button>
          </>
        )}
        {tab === 8 && (
          <>
            <label>
              Status do diagnóstico
              <select
                value={data.status}
                onChange={(e) =>
                  update({ status: e.target.value as DiagnosticCase["status"] })
                }
              >
                {["pendente", "em análise", "confirmado", "resolvido"].map(
                  (v) => (
                    <option key={v}>{v}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              Reparo recomendado / executado
              <textarea
                value={data.repair}
                onChange={(e) => update({ repair: e.target.value })}
              />
            </label>
            <label>
              Peças eventualmente necessárias
              <textarea
                value={data.parts}
                onChange={(e) => update({ parts: e.target.value })}
              />
            </label>
            <label>
              Teste de confirmação após reparo
              <textarea
                value={data.retest}
                onChange={(e) => update({ retest: e.target.value })}
              />
            </label>
            {checklist(["repair"])}
            {issue && <p role="status">{issue}</p>}
            <div className="ad-actions">
              <button
                onClick={() => {
                  if (generate()) requestAnimationFrame(() => window.print());
                }}
              >
                Imprimir relatório
              </button>
              <button disabled={busy} onClick={exportPdf}>
                Exportar PDF
              </button>
              <button
                onClick={() => {
                  const text = generate();
                  if (text)
                    download(
                      "diagnostico-alternador.txt",
                      new Blob([text], { type: "text/plain;charset=utf-8" }),
                    );
                }}
              >
                Exportar texto
              </button>
              <button
                onClick={async () => {
                  const text = generate();
                  if (!text) return;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: "Relatório EDSON OFICINA",
                        text,
                      });
                    } catch {
                      setMessage(
                        "Compartilhamento não concluído; use a exportação.",
                      );
                    }
                  } else
                    setMessage(
                      "Compartilhamento nativo indisponível. Exporte o PDF ou texto para compartilhar.",
                    );
                }}
              >
                Compartilhar relatório
              </button>
              <button
                onClick={() => {
                  if (valid())
                    download(
                      "diagnostico-alternador.json",
                      new Blob([JSON.stringify(data, null, 2)], {
                        type: "application/json",
                      }),
                    );
                }}
              >
                Exportar registro JSON
              </button>
              <button onClick={() => importer.current?.click()}>
                Importar registro JSON
              </button>
              <input
                ref={importer}
                hidden
                aria-label="Importar arquivo de diagnóstico"
                type="file"
                accept="application/json,.json"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    if (f.size > 150000) throw new Error();
                    const parsed = caseSchema.parse(JSON.parse(await f.text()));
                    parsed.reference.origin = "technician";
                    parsed.reference.entryId = "";
                    setData(parsed);
                    setRecord(null);
                    setStamp("");
                    setMessage(
                      "Registro importado. Confira medições e referência antes de usar.",
                    );
                  } catch {
                    setMessage(
                      "Arquivo de diagnóstico inválido ou maior que 150 KB.",
                    );
                  }
                  e.target.value = "";
                }}
              />
            </div>
            <pre className="ad-report" ref={report}>
              {reportText(
                data,
                record?.id || draftNumber,
                stamp || "Gerar ao imprimir/exportar",
              )}
            </pre>
            {record && (
              <button
                disabled={busy}
                onClick={() => {
                  if (!pendingDelete) {
                    setPendingDelete(true);
                    return;
                  }
                  void task(async () => {
                    await request(
                      "/api/diagnostics/alternator?id=" +
                        encodeURIComponent(record.id),
                      { method: "DELETE" },
                    );
                    setRecord(null);
                    setCases([]);
                    setPendingDelete(false);
                    setMessage(
                      "Registro da conta excluído; dados atuais permanecem como rascunho.",
                    );
                  });
                }}
              >
                {pendingDelete
                  ? "Confirmar exclusão deste registro"
                  : "Excluir registro salvo"}
              </button>
            )}
          </>
        )}
      </div>
      <footer className="ad-footer">
        <button disabled={tab === 0} onClick={() => setTab((t) => t - 1)}>
          ← Aba anterior
        </button>
        <button disabled={tab === 8} onClick={() => setTab((t) => t + 1)}>
          Próxima aba →
        </button>
      </footer>
    </section>
  );
}
