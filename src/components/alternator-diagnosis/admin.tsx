"use client";
import { useEffect, useState } from "react";
import {
  emptyCase,
  entrySchema,
  type TechnicalEntry,
} from "@/lib/alternator-diagnosis/schema";
const blank = (): TechnicalEntry => ({
  kind: "variant",
  title: "",
  body: "",
  url: "",
  sourceTitle: "",
  sourceUrl: "",
  sourceDate: "",
  application: "",
  published: false,
  vehicle: emptyCase().vehicle,
  limits: {},
  rippleMethod: "unknown",
});
export function AlternatorDiagnosisAdmin() {
  const [entry, setEntry] = useState<TechnicalEntry>(blank),
    [rows, setRows] = useState<{ id: string; data: TechnicalEntry }[]>([]),
    [json, setJson] = useState(
      JSON.stringify(
        { vehicle: emptyCase().vehicle, limits: {}, rippleMethod: "unknown" },
        null,
        2,
      ),
    ),
    [message, setMessage] = useState("Carregando…"),
    [busy, setBusy] = useState(false);
  async function refresh() {
    try {
      const r = await fetch("/api/diagnostics/alternator/references?admin=1", {
        cache: "no-store",
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error);
      setRows(body.entries);
      setMessage(
        "Cadastro carregado. Rascunhos não são exibidos aos visitantes.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro ao carregar.");
    }
  }
  useEffect(() => {
    let active = true;
    fetch("/api/diagnostics/alternator/references?admin=1", {
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        if (active) {
          setRows(body.entries);
          setMessage("Cadastro carregado.");
        }
      })
      .catch((error) => {
        if (active)
          setMessage(
            error instanceof Error ? error.message : "Erro ao carregar.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  async function save() {
    setBusy(true);
    try {
      const fields = JSON.parse(json);
      const parsed = entrySchema.parse({ ...entry, ...fields });
      const response = await fetch("/api/diagnostics/alternator/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      await refresh();
      setEntry({ ...parsed, id: body.id });
      setMessage("Referência salva.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Dados inválidos.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="alternator-diagnosis">
      <h1>Base técnica do alternador</h1>
      <p>
        Somente administradores podem editar. Identifique aplicação, fonte,
        revisão e procedimento antes de publicar. Não há valores universais
        pré-preenchidos.
      </p>
      <p role="status">{message}</p>
      <label>
        Registro
        <select
          value={entry.id || ""}
          onChange={(e) => {
            const row = rows.find((r) => r.id === e.target.value);
            const value = row ? { ...row.data, id: row.id } : blank();
            setEntry(value);
            setJson(
              JSON.stringify(
                {
                  vehicle: value.vehicle,
                  limits: value.limits,
                  rippleMethod: value.rippleMethod,
                },
                null,
                2,
              ),
            );
          }}
        >
          <option value="">Novo registro</option>
          {rows.map((r) => (
            <option key={r.id} value={r.id}>
              {r.data.title} · {r.data.published ? "Publicado" : "Rascunho"}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tipo
        <select
          value={entry.kind}
          onChange={(e) =>
            setEntry({
              ...entry,
              kind: e.target.value as TechnicalEntry["kind"],
            })
          }
        >
          {[
            "variant",
            "fault",
            "test",
            "image",
            "diagram",
            "bulletin",
            "dtc",
            "video",
            "procedure",
          ].map((kind) => (
            <option key={kind}>{kind}</option>
          ))}
        </select>
      </label>
      {(
        [
          "title",
          "url",
          "sourceTitle",
          "sourceUrl",
          "sourceDate",
          "application",
        ] as const
      ).map((key) => (
        <label key={key}>
          {
            {
              title: "Título",
              url: "URL do material HTTPS (imagem licenciada, vídeo, diagrama ou boletim)",
              sourceTitle: "Fonte / titular e licença quando houver imagem",
              sourceUrl: "URL HTTPS da documentação",
              sourceDate: "Data / revisão da fonte",
              application: "Aplicabilidade",
            }[key]
          }
          <input
            value={entry[key]}
            onChange={(e) => setEntry({ ...entry, [key]: e.target.value })}
          />
        </label>
      ))}
      <label>
        Conteúdo técnico / condições e procedimento
        <textarea
          value={entry.body}
          onChange={(e) => setEntry({ ...entry, body: e.target.value })}
        />
      </label>
      <label>
        Dados estruturados da aplicação (JSON)
        <textarea
          rows={18}
          spellCheck={false}
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
      </label>
      <p>
        Uma variante exige vehicle e limits. Use chaves do interpretador: rest,
        crank, idle, loaded, rpmVoltage, bplus, positiveDrop, groundDrop,
        current, ripple, rpm, temperature, soc, soh, ecu, excitationCurrent,
        sleepCurrent. Cada limite contém min e max como texto numérico; vazio
        significa não confirmado. Ripple em V, com rippleMethod scope-pp ou
        meter-rms. Veículo, motor, código, tensão e gerenciamento devem
        corresponder à fonte.
      </p>
      <label>
        <input
          type="checkbox"
          checked={entry.published}
          onChange={(e) => setEntry({ ...entry, published: e.target.checked })}
        />
        Publicar para consulta
      </label>
      <button disabled={busy} onClick={save}>
        Salvar referência técnica
      </button>
    </section>
  );
}
