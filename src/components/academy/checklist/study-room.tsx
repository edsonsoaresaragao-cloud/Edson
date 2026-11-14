"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  COURSE_HOURS,
  LESSON_TITLE,
  LESSON_SUBTITLE,
  steps,
  sourcePages,
  pageTranscript,
  manualNote,
  PASSING_SCORE,
} from "@/lib/academy/checklist/content";
import type { StudentProgress } from "@/lib/academy/progress";
import { PageReader, type PageVoiceSettings } from "./page-reader";
import { ChecklistMaterialViewer } from "./material-viewer";
type Question = { id: string; prompt: string; options: string[] };
type Feedback = {
  id: string;
  correct: boolean;
  correctIndex: number;
  explanation: string;
};
const endpoint = "/api/academy/aula-02/progress";
export function ChecklistStudyRoom({
  questions,
}: {
  questions: Record<string, Question[]>;
}) {
  const [active, setActive] = useState("introducao"),
    [progress, setProgress] = useState<
      (StudentProgress & { hours?: number | null }) | null
    >(null);
  const [account, setAccount] = useState<
    "loading" | "guest" | "student" | "error"
  >("loading");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({}),
    [feedback, setFeedback] = useState<Feedback[]>([]),
    [checked, setChecked] = useState<Record<string, boolean>>({});
  const [voice, setVoice] = useState<PageVoiceSettings>({ voice: "", rate: 1 });
  const heading = useRef<HTMLHeadingElement>(null);
  const current = steps.find((s) => s.id === active) || steps[0],
    position = steps.indexOf(current);
  const source = sourcePages.find((p) => p.page === current.page);
  const completion = progress?.completed.find((p) => p.step === active);
  const completed = Boolean(completion);
  const points = source?.points || [];
  const allChecked = points.every(
    (_, i) => checked[`${active}:${i + 1}`] || completed,
  );
  const hours = progress?.hours ?? COURSE_HOURS;
  useEffect(() => {
    const controller = new AbortController();
    const hash = decodeURIComponent(location.hash.slice(1));
    fetch(endpoint, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          setAccount("guest");
          if (steps.some((s) => s.id === hash)) setActive(hash);
          return;
        }
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error || "Não foi possível carregar o progresso.",
          );
        setProgress(data.progress);
        setAccount("student");
        setActive(
          steps.some((s) => s.id === hash) ? hash : data.progress.lastStep,
        );
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setAccount("error");
          setError(e.message || "Falha ao carregar o progresso.");
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
          ...(action === "complete"
            ? {
                answers,
                checks: points
                  .map((_, i) => `${active}:${i + 1}`)
                  .filter((id) => checked[id] || completed),
              }
            : {}),
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
        setAnswers({});
        setFeedback([]);
        history.replaceState(null, "", `#${data.progress.lastStep}`);
      }
      if (action !== "visit") {
        setMessage(data.message);
        setFeedback(data.feedback || []);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Falha de conexão. Tente novamente.",
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
    requestAnimationFrame(() => heading.current?.focus());
    if (progress?.started) await save("visit", id);
  }
  return (
    <div className="academy-study academy-checklist-study">
      <header className="academy-study-heading">
        <span className="eyebrow">
          EDSON OFICINA ACADEMY / AULAS ORGANIZADAS
        </span>
        <h1>{LESSON_TITLE}</h1>
        <p>{LESSON_SUBTITLE}</p>
        <p>
          Motor e sistemas de distribuição ·{" "}
          {hours === null
            ? "Carga horária a validar pelo responsável"
            : `${hours} horas de estudo previstas`}
        </p>
        <Link href="/academy/aulas" className="text-link">
          ← Voltar à biblioteca de aulas
        </Link>
      </header>
      <div className="academy-learning-grid">
        <aside className="academy-sidebar">
          <h2>Seu percurso</h2>
          <label className="academy-progress-label">
            Progresso: {progress?.percent || 0}%
            <progress
              aria-label="Progresso da Aula 02"
              max={100}
              value={progress?.percent || 0}
            />
          </label>
          <p>{progress?.completed.length || 0} de 5 etapas concluídas</p>
          <nav aria-label="Etapas da Aula 02">
            {steps.map((s, i) => (
              <button
                type="button"
                key={s.id}
                disabled={busy}
                aria-current={active === s.id ? "step" : undefined}
                onClick={() => go(s.id)}
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
        <div
          className="academy-study-main"
          aria-label="Área de estudo da Aula 02"
        >
          <section
            className="academy-enrollment"
            aria-label="Conta e progresso"
          >
            {account === "loading" ? (
              <p role="status">Carregando seu progresso…</p>
            ) : account === "guest" ? (
              <>
                <p>
                  Consulte o material. Entre na sua conta para iniciar a aula,
                  salvar o progresso e receber a correção.
                </p>
                <Link className="button" href="/login">
                  Entrar para iniciar aula
                </Link>{" "}
                <Link className="text-link" href="/cadastro">
                  Criar minha conta
                </Link>
              </>
            ) : !progress?.started ? (
              <>
                <p>
                  Inicie a aula para registrar seu estudo na Área do aluno.
                  Navegar e ouvir não concluem etapas.
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
          </section>
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
          <article aria-labelledby="checklist-step-title">
            <h2 id="checklist-step-title" tabIndex={-1} ref={heading}>
              {current.title}
              {completed ? " · Concluída" : ""}
            </h2>
            {completion && (
              <p className="academy-note">
                Melhor resultado salvo nesta etapa: {completion.score}%.
              </p>
            )}
            {source && (
              <PageReader
                key={source.page}
                page={source.page}
                paragraphs={pageTranscript(source)}
                settings={voice}
                onSettingsChange={setVoice}
              />
            )}
            <h3>O que você vai aprender</h3>
            <ul>
              {current.objectives.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
            <section>
              <h3>Explicação do professor · EDSON OFICINA Academy</h3>
              {current.explanation.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </section>
            <p className="academy-warning">{manualNote}</p>
            {source && (
              <ChecklistMaterialViewer
                key={`material:${source.page}`}
                page={source}
              />
            )}
            {points.length > 0 && (
              <section
                className="academy-digital-checklist"
                aria-label="Checklist digital de estudo"
              >
                <h3>Checklist digital · sete pontos de estudo</h3>
                <p>
                  Marque cada ponto lido. As marcações representam estudo, sem
                  atestar execução de um serviço no veículo. A etapa e seu
                  resultado ficam salvos ao concluir.
                </p>
                {points.map((point, i) => {
                  const id = `${active}:${i + 1}`;
                  return (
                    <fieldset key={id}>
                      <legend>
                        {i + 1}. {point.title}
                      </legend>
                      {point.lines.map((line, n) => (
                        <p key={n}>
                          <strong>
                            {line.kind === "ok"
                              ? "Condição esperada: "
                              : "Sinal de problema: "}
                          </strong>
                          {line.text}
                        </p>
                      ))}
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={Boolean(checked[id] || completed)}
                          disabled={busy || completed}
                          onChange={(e) =>
                            setChecked((c) => ({
                              ...c,
                              [id]: e.target.checked,
                            }))
                          }
                        />
                        Estudei este ponto
                      </label>
                    </fieldset>
                  );
                })}
                <div className="academy-note">
                  <strong>
                    Síntese de liberação na fonte — só dê partida se:
                  </strong>
                  <ul>
                    {source?.release.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                  <p>{source?.footnote}</p>
                </div>
              </section>
            )}
            <form
              className="academy-quiz form"
              onSubmit={(e) => {
                e.preventDefault();
                void save("complete", active);
              }}
            >
              {questions[active].length > 0 && (
                <h3>
                  {active === "avaliacao"
                    ? `Avaliação final · 10 perguntas · mínimo ${PASSING_SCORE}%`
                    : "Perguntas de fixação"}
                </h3>
              )}
              {questions[active].map((q, i) => {
                const result = feedback.find((f) => f.id === q.id);
                return (
                  <fieldset key={`${active}:${q.id}`}>
                    <legend>
                      {i + 1}. {q.prompt}
                    </legend>
                    {q.options.map((option, n) => (
                      <label className="check" key={option}>
                        <input
                          type="radio"
                          name={q.id}
                          value={n}
                          required
                          checked={answers[q.id] === n}
                          onChange={() =>
                            setAnswers((a) => ({ ...a, [q.id]: n }))
                          }
                        />
                        {option}
                      </label>
                    ))}
                    {result && (
                      <div className="academy-answer">
                        <strong>
                          {result.correct
                            ? "Correto."
                            : "Revise esta resposta."}
                        </strong>
                        <p>Resposta: {q.options[result.correctIndex]}</p>
                        <p>{result.explanation}</p>
                      </div>
                    )}
                  </fieldset>
                );
              })}
              <div className="academy-step-actions">
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy || position === 0}
                  onClick={() => go(steps[position - 1].id)}
                >
                  Anterior
                </button>
                <button
                  type="submit"
                  className="button"
                  disabled={busy || !progress?.started || !allChecked}
                >
                  {busy
                    ? "Salvando…"
                    : questions[active].length
                      ? "Corrigir respostas e marcar estudado"
                      : "Marcar estudado"}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy || position === steps.length - 1}
                  onClick={() => go(steps[position + 1].id)}
                >
                  Próxima etapa
                </button>
              </div>
              {!progress?.started ? (
                <p>
                  Entre e inicie a aula para registrar respostas e conclusão.
                </p>
              ) : !allChecked ? (
                <p>Marque os sete pontos estudados para concluir esta etapa.</p>
              ) : null}
            </form>
          </article>
          {progress?.eligible && (
            <section className="academy-note" aria-label="Aula concluída">
              <h2>Aula 02 concluída</h2>
              <p>
                As cinco etapas foram aprovadas. Seu resultado está salvo na
                Área do aluno.
              </p>
              <Link href="/aluno" className="button secondary">
                Ver meu progresso
              </Link>
            </section>
          )}
          <p className="academy-course-note">
            Fonte técnica e imagens: Ponto do Motor. Explicações e atividades:
            EDSON OFICINA Academy. Curso livre, sem alegação de reconhecimento
            oficial ou acadêmico.
            {hours === null
              ? " Carga horária aguardando validação do responsável."
              : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
