"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  COURSE_ID,
  COURSE_HOURS,
  LESSON_TITLE,
  LESSON_SUBTITLE,
  studySteps,
  classifications,
  fundamentals,
  diagnosticSteps,
  workshopCare,
  PASSING_SCORE,
} from "@/lib/academy/content";
import type { StudentProgress } from "@/lib/academy/progress";
import { MaterialViewer } from "./material-viewer";
import { TimingDiagram } from "./timing-diagram";
type Question = { id: string; prompt: string; options: string[] };
type Feedback = {
  id: string;
  correct: boolean;
  correctIndex: number;
  explanation: string;
};
const endpoint = "/api/academy/aula-01/progress";
export function StudyRoom({
  questions,
}: {
  questions: Record<string, Question[]>;
}) {
  const [active, setActive] = useState("introducao"),
    [progress, setProgress] = useState<StudentProgress | null>(null);
  const [account, setAccount] = useState<
    "loading" | "guest" | "student" | "error"
  >("loading");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({}),
    [feedback, setFeedback] = useState<Feedback[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const current = studySteps.find((s) => s.id === active) || studySteps[0];
  const position = studySteps.indexOf(current),
    completed = progress?.completed.some((p) => p.step === active);
  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          setAccount("guest");
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setProgress(data.progress);
        setAccount("student");
        const hash = decodeURIComponent(location.hash.slice(1));
        setActive(
          studySteps.some((s) => s.id === hash) ? hash : data.progress.lastStep,
        );
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setAccount("error");
          setError(e.message || "Não foi possível carregar o progresso.");
        }
      });
    return () => controller.abort();
  }, []);
  async function save(action: "start" | "visit" | "complete", step?: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(step ? { step } : {}),
          ...(action === "complete" ? { answers } : {}),
        }),
      });
      const data = await response.json();
      if (response.status === 401) setAccount("guest");
      if (!response.ok)
        throw new Error(data.error || "Não foi possível salvar.");
      setProgress(data.progress);
      setAccount("student");
      if (action === "start") {
        setActive(data.progress.lastStep);
        setFeedback([]);
        setAnswers({});
        history.replaceState(null, "", `#${data.progress.lastStep}`);
      }
      if (action !== "visit") {
        setMessage(data.message);
        setFeedback(data.feedback || []);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Falha de conexão. Tente novamente; sua etapa não foi marcada como concluída.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function go(id: string) {
    if (busy) return;
    setActive(id);
    setAnswers({});
    setFeedback([]);
    setError("");
    setMessage("");
    history.replaceState(null, "", `#${id}`);
    heading.current?.focus();
    if (progress?.started) await save("visit", id);
  }
  async function certificate() {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("id", COURSE_ID);
      const response = await fetch("/api/actions/certificate", {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Não foi possível emitir o certificado.");
      if (
        typeof data.redirect === "string" &&
        data.redirect.startsWith("/certificados/")
      )
        location.assign(data.redirect);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Falha na emissão. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="academy-study">
      <header className="academy-study-heading">
        <span className="eyebrow">
          EDSON OFICINA ACADEMY / AULAS ORGANIZADAS
        </span>
        <h1>{LESSON_TITLE}</h1>
        <p>{LESSON_SUBTITLE}</p>
        <p>
          Motor e sistemas de distribuição · Mecânica intermediária e avançada ·{" "}
          {COURSE_HOURS} horas
        </p>
        <Link href="/academy/aulas" className="text-link">
          ← Biblioteca de aulas
        </Link>
      </header>
      <div className="academy-learning-grid">
        <aside className="academy-sidebar">
          <h2>Seu percurso</h2>
          <label className="academy-progress-label">
            Progresso: {progress?.percent || 0}%
            <progress
              aria-label="Progresso da Aula 01"
              max="100"
              value={progress?.percent || 0}
            />
          </label>
          <p>
            {progress?.completed.length || 0} de {studySteps.length} etapas
            concluídas
          </p>
          <nav aria-label="Etapas da Aula 01">
            {studySteps.map((s, i) => (
              <button
                type="button"
                key={s.id}
                onClick={() => go(s.id)}
                disabled={busy}
                aria-current={active === s.id ? "step" : undefined}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {s.title}
                {progress?.completed.some((p) => p.step === s.id) && (
                  <span aria-label="Concluída">✓</span>
                )}
              </button>
            ))}
          </nav>
        </aside>
        <div className="academy-study-main" aria-label="Área de estudo">
          <div className="academy-enrollment">
            {account === "loading" ? (
              <p role="status">Carregando seu progresso…</p>
            ) : account === "guest" ? (
              <>
                <p>
                  Explore o conteúdo. Para iniciar, salvar o progresso e fazer
                  as avaliações, entre na sua conta.
                </p>
                <Link className="button" href="/login">
                  Entrar para iniciar aula
                </Link>{" "}
                <Link href="/cadastro" className="text-link">
                  Criar minha conta
                </Link>
              </>
            ) : !progress?.started ? (
              <>
                <p>
                  O progresso só começa com sua matrícula. Nenhuma visita é
                  registrada como conclusão.
                </p>
                <button
                  type="button"
                  className="button"
                  disabled={busy}
                  onClick={() => save("start")}
                >
                  {account === "error"
                    ? "Tentar carregar e iniciar aula"
                    : "Iniciar aula"}
                </button>
              </>
            ) : (
              <p>
                Progresso salvo na sua conta. Você pode sair e continuar de onde
                parou.
              </p>
            )}
          </div>
          {error && (
            <p
              className="academy-warning"
              role="alert"
              aria-label="Erro na atividade"
            >
              {error}
            </p>
          )}
          {message && (
            <p
              className="academy-note"
              role="status"
              aria-label="Resultado da atividade"
            >
              {message}
            </p>
          )}
          <article>
            <span className="eyebrow">
              ETAPA {position + 1} / {studySteps.length}
              {completed ? " · CONCLUÍDA" : ""}
            </span>
            <h2 ref={heading} tabIndex={-1}>
              {current.title}
            </h2>
            <section>
              <h3>O que você vai aprender</h3>
              <ul>
                {current.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </section>
            {current.kind !== "manufacturer" && (
              <section>
                <h3>Explicação do professor · EDSON OFICINA Academy</h3>
                {current.explanation.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </section>
            )}
            {current.kind === "intro" && (
              <>
                <div className="academy-classifications">
                  {classifications.map(([title, text]) => (
                    <section key={title}>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </section>
                  ))}
                </div>
                <p className="academy-note">
                  Fonte visual: Ponto do Motor. Explicações e atividades: EDSON
                  OFICINA Academy.
                </p>
              </>
            )}
            {current.kind === "fundamentals" && (
              <>
                {fundamentals.map(([title, text]) => (
                  <section key={title}>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </section>
                ))}
                <TimingDiagram />
                <div className="academy-classifications">
                  {classifications.map(([title, text]) => (
                    <section key={title}>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </section>
                  ))}
                </div>
              </>
            )}
            {current.page && (
              <>
                <h3>
                  {current.kind === "manufacturer"
                    ? `Tabela completa · ${current.rows} linhas preservadas`
                    : "Material de referência · capa"}
                </h3>
                <MaterialViewer key={current.id} initialPage={current.page} />
              </>
            )}
            {current.kind === "manufacturer" && (
              <>
                {" "}
                <section>
                  <h3>Explicação do professor · EDSON OFICINA Academy</h3>
                  {current.explanation.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </section>
                <section className="academy-source-alert">
                  <h3>Alerta da fonte · síntese de leitura</h3>
                  <p>{current.sourceAlert}</p>
                  <h3>Dica da fonte · contexto</h3>
                  <p>{current.sourceTip}</p>
                  <p>
                    A redação integral, as imagens e a referência citada estão
                    na página acima. Estas sínteses não substituem a tabela.
                  </p>
                </section>
                <section>
                  <h3>Atenção na oficina · orientação didática</h3>
                  <ul>
                    {workshopCare.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3>Diagnóstico nesta aplicação</h3>
                  <p>
                    Identifique {current.focus}; confronte código, ano e versão
                    com o manual. Preserve o histórico e inspecione a
                    distribuição antes de permitir rotação. Falta de evidência
                    de contato não confirma válvulas íntegras.
                  </p>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => go("diagnostico")}
                  >
                    Consultar diagnóstico prático
                  </button>
                </section>
              </>
            )}
            {current.kind === "diagnosis" && (
              <>
                <h3>
                  Como diagnosticar suspeita de válvula empenada após falha no
                  sincronismo
                </h3>
                <ol className="academy-diagnostic-steps">
                  {diagnosticSteps.map(([title, text]) => (
                    <li key={title}>
                      <h4>{title}</h4>
                      <p>{text}</p>
                    </li>
                  ))}
                </ol>
                <p className="academy-warning">
                  Não usar a partida para investigar uma possível colisão.
                  Valores de compressão, folgas, torques e posições de teste
                  devem vir da documentação do fabricante.
                </p>
              </>
            )}
            <form
              className="academy-quiz form"
              onSubmit={(e) => {
                e.preventDefault();
                save("complete", active);
              }}
            >
              {questions[active].length > 0 && (
                <h3>
                  {current.kind === "exam"
                    ? `Avaliação final · 10 perguntas · mínimo ${PASSING_SCORE}%`
                    : "Pergunta de fixação"}
                </h3>
              )}
              {questions[active].map((q, i) => (
                <fieldset key={`${active}:${q.id}`}>
                  <legend>
                    {i + 1}. {q.prompt}
                  </legend>
                  {q.options.map((o, index) => (
                    <label className="check" key={o}>
                      <input
                        type="radio"
                        name={q.id}
                        required
                        value={index}
                        checked={answers[q.id] === index}
                        onChange={() =>
                          setAnswers((v) => ({ ...v, [q.id]: index }))
                        }
                      />
                      {o}
                    </label>
                  ))}
                  {feedback.find((f) => f.id === q.id) && (
                    <div className="academy-answer">
                      <strong>
                        {feedback.find((f) => f.id === q.id)?.correct
                          ? "Correto."
                          : "Revise esta resposta."}
                      </strong>
                      <p>
                        Resposta:{" "}
                        {
                          q.options[
                            feedback.find((f) => f.id === q.id)!.correctIndex
                          ]
                        }
                      </p>
                      <p>{feedback.find((f) => f.id === q.id)?.explanation}</p>
                    </div>
                  )}
                </fieldset>
              ))}
              <div className="academy-step-actions">
                <button
                  type="button"
                  className="button secondary"
                  disabled={position === 0 || busy}
                  onClick={() => go(studySteps[position - 1].id)}
                >
                  Anterior
                </button>
                <button
                  type="submit"
                  className="button"
                  disabled={busy || !progress?.started}
                >
                  {busy
                    ? "Salvando…"
                    : questions[active].length
                      ? "Corrigir respostas e concluir etapa"
                      : "Marcar como concluído"}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={position === studySteps.length - 1 || busy}
                  onClick={() => go(studySteps[position + 1].id)}
                >
                  Próxima aula
                </button>
              </div>
              {!progress?.started && (
                <p>
                  Entre e inicie a aula para registrar respostas e conclusão.
                </p>
              )}
            </form>
          </article>
          <section className="academy-certificate">
            <h2>Certificado de participação</h2>
            <p>
              Conclua as {studySteps.length} etapas e alcance {PASSING_SCORE}%
              nos exercícios e na avaliação final. Carga horária definida:{" "}
              {COURSE_HOURS} horas. Curso livre, sem reconhecimento oficial ou
              acadêmico.
            </p>
            <button
              type="button"
              className="button"
              disabled={busy || !progress?.eligible}
              onClick={certificate}
            >
              Emitir meu certificado
            </button>
            <p>
              O certificado utiliza seu nome cadastrado, título da aula, data de
              emissão e código verificável no sistema atual da Academy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
