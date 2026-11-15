"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  LibraryCourse,
  LibraryPublicationStatus,
  PublicLibraryDocument,
  LibraryAvailableLesson,
} from "@/lib/academy/library/types";
import type { StudentProgress } from "@/lib/academy/progress";
import { PageReader, type PageVoiceSettings } from "../checklist/page-reader";
import { LibraryMaterialViewer } from "./material-viewer";
import { BudgetActivity } from "./budget-activity";
import styles from "./library.module.css";

type Question = {
  id: string;
  prompt: string;
  options: string[];
  pages: number[];
};
type Feedback = {
  id: string;
  correct: boolean;
  correctIndex: number;
  explanation: string;
};
type LibraryStudentProgress = StudentProgress & { hours?: number | null };
export type LibraryRoomProps = {
  course: LibraryCourse;
  document: PublicLibraryDocument | null;
  status: LibraryPublicationStatus;
  canStudy: boolean;
  canView: boolean;
  preview: boolean;
  availableLessons: LibraryAvailableLesson[];
  questions: Record<string, Question[]>;
};
const normalized = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function LibraryStudyRoom({
  course,
  document,
  status,
  canStudy,
  canView,
  preview,
  availableLessons,
  questions,
}: LibraryRoomProps) {
  const [active, setActive] = useState("pagina-1");
  const [query, setQuery] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [topic, setTopic] = useState("");
  const [pageInput, setPageInput] = useState("1");
  const [mode, setMode] = useState<"original" | "teacher">("original");
  const [voice, setVoice] = useState<PageVoiceSettings>({ voice: "", rate: 1 });
  const [progress, setProgress] = useState<LibraryStudentProgress | null>(null);
  const [account, setAccount] = useState<
    "loading" | "guest" | "student" | "error" | "restricted"
  >(canStudy ? "loading" : "restricted");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [studied, setStudied] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const pages = useMemo(() => document?.pages || [], [document]);
  const page = pages.find((value) => active === `pagina-${value.number}`);
  const currentQuestions = questions[active] || [];
  const hasExam = Boolean(questions.avaliacao?.length);
  const completed = progress?.completed.find((value) => value.step === active);
  const effectiveHours =
    progress?.hours === undefined ? course.hours : progress.hours;
  const endpoint = `/api/academy/library/${course.slug}/progress`;

  useEffect(() => {
    const controller = new AbortController();
    const validStep = (value: string) =>
      pages.some((p) => value === `pagina-${p.number}`) ||
      (value === "avaliacao" && hasExam);
    function fromHash() {
      const value = window.location.hash.slice(1);
      if (validStep(value)) {
        setActive(value);
        setPageInput(value.replace("pagina-", ""));
        setAnswers({});
        setFeedback([]);
        setStudied(false);
        setMode("original");
        setMessage("");
        setError("");
      }
    }
    const hash = window.location.hash.slice(1);
    Promise.resolve().then(async () => {
      if (validStep(hash)) {
        setActive(hash);
        setPageInput(hash.replace("pagina-", ""));
      }
      if (!canStudy) return;
      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        if (response.status === 401) {
          setAccount("guest");
          return;
        }
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error || "Não foi possível carregar o progresso.",
          );
        if (controller.signal.aborted) return;
        setProgress(data.progress);
        setAccount("student");
        if (
          !validStep(window.location.hash.slice(1)) &&
          validStep(data.progress.lastStep)
        ) {
          setActive(data.progress.lastStep);
          setPageInput(data.progress.lastStep.replace("pagina-", ""));
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setAccount("error");
          setError(
            cause instanceof Error
              ? cause.message
              : "Falha ao carregar o progresso.",
          );
        }
      }
    });
    window.addEventListener("hashchange", fromHash);
    return () => {
      controller.abort();
      window.removeEventListener("hashchange", fromHash);
    };
  }, [canStudy, endpoint, hasExam, pages]);

  async function save(action: "start" | "visit" | "complete", step = active) {
    if (!canStudy || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "start" ? {} : { step }),
          ...(action === "complete"
            ? { answers, studied: studied || Boolean(completed) }
            : {}),
        }),
      });
      const data = await response.json();
      if (response.status === 401) setAccount("guest");
      if (!response.ok)
        throw new Error(data.error || "Não foi possível salvar a atividade.");
      setProgress(data.progress);
      setAccount("student");
      if (action === "start") {
        setActive(data.progress.lastStep);
        setPageInput(data.progress.lastStep.replace("pagina-", ""));
        history.replaceState(null, "", `#${data.progress.lastStep}`);
      }
      if (action !== "visit") {
        setMessage(data.message);
        setFeedback(data.feedback || []);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Falha de conexão. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function go(step: string) {
    if (busy) return;
    setActive(step);
    setPageInput(step.replace("pagina-", ""));
    setAnswers({});
    setFeedback([]);
    setMessage("");
    setError("");
    setStudied(false);
    setMode("original");
    history.replaceState(null, "", `#${step}`);
    requestAnimationFrame(() => heading.current?.focus());
    if (progress?.started) await save("visit", step);
  }
  const manufacturers = Array.from(
    new Set(pages.flatMap((p) => (p.manufacturer ? [p.manufacturer] : []))),
  ).sort();
  const topics = Array.from(
    new Set(pages.flatMap((p) => p.topics || [])),
  ).sort();
  const terms = normalized(query).trim().split(/\s+/).filter(Boolean);
  const filtered = pages.filter((p) => {
    const text = normalized(
      [
        p.number,
        p.title,
        p.manufacturer,
        p.engine,
        p.models?.join(" "),
        p.guide,
        p.part,
        p.topics?.join(" "),
        ...p.transcript,
      ].join(" "),
    );
    return (
      (!manufacturer || p.manufacturer === manufacturer) &&
      (!topic || p.topics?.includes(topic)) &&
      terms.every((term) => text.includes(term))
    );
  });
  const teacher = page?.teacher || [];
  const readyOriginal =
    page?.review === "verified" && Boolean(page.transcript.length);
  const paragraphs = mode === "teacher" ? teacher : page?.transcript || [];
  const canNarrate =
    mode === "teacher"
      ? teacher.length > 0
      : readyOriginal || (preview && Boolean(page?.transcript.length));
  const pagePosition = pages.findIndex((p) => p.number === page?.number);
  const allSteps = [
    ...pages.map((p) => `pagina-${p.number}`),
    ...(hasExam ? ["avaliacao"] : []),
  ];
  const stepPosition = allSteps.indexOf(active);

  return (
    <div className={`academy-study ${styles.root}`}>
      <header className="academy-study-heading">
        <span className="eyebrow">
          EDSON OFICINA ACADEMY / AULAS ORGANIZADAS
        </span>
        <h1>{course.title}</h1>
        <p>{course.description}</p>
        <p>
          {course.category} · {course.difficulty} ·{" "}
          {effectiveHours === null
            ? "Carga horária a validar pelo responsável"
            : `${effectiveHours} ${effectiveHours === 1 ? "hora" : "horas"} de estudo previstas`}
        </p>
        <Link href="/academy/aulas" className="text-link">
          ← Voltar à biblioteca de aulas
        </Link>
      </header>
      {!document ? (
        <section
          className={`card ${styles.preparation}`}
          aria-label="Preparação da aula"
        >
          <span className="tag">
            {status.receivedPages === 0
              ? "PDF A IMPORTAR"
              : "ACESSO EM PREPARAÇÃO"}
          </span>
          <h2>
            {status.receivedPages === 0
              ? "O PDF desta aula ainda não está disponível"
              : "Material em preparação editorial"}
          </h2>
          <p>
            {status.receivedPages} de {course.expectedPages} páginas recebidas ·{" "}
            {status.reviewedPages} páginas conferidas.
          </p>
          <p>
            {status.receivedPages === 0
              ? "Esta aula precisa do PDF completo para exibir suas páginas. Enquanto isso, consulte abaixo as aulas que já têm material."
              : "O material ainda precisa de autorização e conferência dos arquivos para consulta."}
          </p>
          <Link className="button secondary" href="/academy/aulas">
            Explorar as aulas disponíveis
          </Link>
          {availableLessons.length > 0 && (
            <section aria-label="Aulas que você já pode visualizar">
              <h3>Você já pode visualizar estas aulas</h3>
              <ul>
                {availableLessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <Link
                      className="text-link"
                      href={`/academy/aulas/${lesson.slug}`}
                    >
                      {lesson.title} · {lesson.pageCount} páginas →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      ) : (
        <div className="academy-learning-grid">
          <aside className="academy-sidebar">
            <h2>Seu percurso</h2>
            {canStudy ? (
              <>
                <label className="academy-progress-label">
                  Progresso: {progress?.percent || 0}%
                  <progress
                    aria-label={`Progresso da Aula ${String(course.number).padStart(2, "0")}`}
                    max={100}
                    value={progress?.percent || 0}
                  />
                </label>
                <p>
                  {progress?.completed.length || 0} de {allSteps.length} etapas
                  concluídas
                </p>
              </>
            ) : (
              <p>
                Página {page?.number || 1} de {pages.length} · Consulta ao
                material
              </p>
            )}
            <div className={styles.filters}>
              <label>
                Pesquisar nesta aula
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Motor, modelo, guia, ferramenta ou DTC"
                />
              </label>
              {manufacturers.length > 0 && (
                <label>
                  Montadora
                  <select
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                  >
                    <option value="">Todas as montadoras</option>
                    {manufacturers.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              )}
              {topics.length > 0 && (
                <label>
                  Assunto
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  >
                    <option value="">Todos os assuntos</option>
                    {topics.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <p role="status" aria-live="polite">
              {filtered.length} página(s) encontrada(s) nesta aula.
            </p>
            <nav
              aria-label={`Páginas da Aula ${String(course.number).padStart(2, "0")}`}
              className={styles.results}
            >
              {filtered.map((p) => (
                <button
                  key={p.number}
                  type="button"
                  disabled={busy}
                  aria-current={
                    active === `pagina-${p.number}` ? "page" : undefined
                  }
                  onClick={() => go(`pagina-${p.number}`)}
                >
                  <span>{String(p.number).padStart(2, "0")}</span>
                  {p.title}
                  <small>
                    {[
                      p.manufacturer,
                      p.engine,
                      p.guide && `Guia ${p.guide}`,
                      p.part && `Parte ${p.part}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                  {progress?.completed.some(
                    (s) => s.step === `pagina-${p.number}`,
                  ) && <span aria-label="Concluída">✓</span>}
                </button>
              ))}
              {hasExam && (
                <button
                  type="button"
                  disabled={busy}
                  aria-current={active === "avaliacao" ? "step" : undefined}
                  onClick={() => go("avaliacao")}
                >
                  <span>✓</span>Avaliação final
                </button>
              )}
            </nav>
          </aside>
          <div className="academy-study-main" aria-label="Área de estudo">
            {preview && !canStudy && (
              <section className={styles.review} aria-label="Prévia editorial">
                <h2>
                  {canView
                    ? "Material disponível para consulta"
                    : "Prévia editorial restrita"}
                </h2>
                <p>
                  {status.receivedPages} de {course.expectedPages} páginas
                  recebidas · {status.reviewedPages} conferidas. Consulte as
                  páginas originais e as explicações. A avaliação e o registro
                  de conclusão aguardam revisão didática.
                </p>
                <ul>
                  {status.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </section>
            )}
            {canStudy && (
              <section
                className="academy-enrollment"
                aria-label="Conta e progresso"
              >
                {account === "loading" ? (
                  <p role="status">Carregando seu progresso…</p>
                ) : account === "guest" ? (
                  <>
                    <p>
                      Entre na sua conta para iniciar a aula e salvar seu
                      estudo.
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
                      Iniciar a aula registra seu estudo na sua conta. Abrir ou
                      ouvir uma página não conclui a etapa.
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
                    Seu progresso é individual e será retomado ao retornar à
                    aula.
                  </p>
                )}
              </section>
            )}
            {error && (
              <p role="alert" className="academy-warning">
                {error}
              </p>
            )}
            {message && (
              <p
                role="status"
                aria-live="polite"
                className="academy-note"
                aria-label="Resultado da atividade"
              >
                {message}
              </p>
            )}
            <h2 ref={heading} tabIndex={-1}>
              {page
                ? `Página ${page.number} — ${page.title}`
                : "Avaliação final"}
              {completed ? " · Concluída" : ""}
            </h2>
            {page && (
              <>
                {Boolean(
                  document.reviewNotes?.length || page.reviewNotes?.length,
                ) && (
                  <details
                    className={styles.review}
                    open={Boolean(page.reviewNotes?.length)}
                  >
                    <summary>Observações técnicas do material</summary>
                    <p>
                      Observações da EDSON OFICINA, separadas do conteúdo
                      original. O documento-fonte permanece preservado.
                    </p>
                    <ul>
                      {[
                        ...(document.reviewNotes || []),
                        ...(page.reviewNotes || []),
                      ].map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </details>
                )}
                <div className={styles.metadata}>
                  {[
                    page.manufacturer,
                    page.engine,
                    page.models?.join(", "),
                    page.guide && `Guia ${page.guide}`,
                    page.part && `Parte ${page.part}`,
                  ]
                    .filter(Boolean)
                    .map((text) => (
                      <span key={text}>{text}</span>
                    ))}
                </div>
                <form
                  className={styles.pageSelect}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const value = Number(pageInput);
                    if (pages.some((p) => p.number === value))
                      void go(`pagina-${value}`);
                  }}
                >
                  <label htmlFor="library-page-number">Ir à página</label>
                  <input
                    id="library-page-number"
                    type="number"
                    min={1}
                    max={document.pageCount}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="button secondary"
                    disabled={busy}
                  >
                    Abrir página
                  </button>
                  <span>de {document.pageCount}</span>
                </form>
                <LibraryMaterialViewer
                  key={page.number}
                  slug={course.slug}
                  total={document.pageCount}
                  pdfParts={document.pdfParts}
                  page={{
                    ...page,
                    image:
                      page.image ||
                      `pagina-${String(page.number).padStart(3, "0")}.jpg`,
                    preview:
                      page.preview ||
                      `preview-${String(page.number).padStart(3, "0")}.webp`,
                  }}
                />
                <div
                  className={styles.modes}
                  role="group"
                  aria-label="Modo de narração"
                >
                  <button
                    type="button"
                    className="button secondary"
                    aria-pressed={mode === "original"}
                    onClick={() => setMode("original")}
                  >
                    Leitura original
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    aria-pressed={mode === "teacher"}
                    disabled={!teacher.length}
                    onClick={() => setMode("teacher")}
                  >
                    Explicação do professor
                  </button>
                </div>
                {canNarrate ? (
                  <PageReader
                    key={`${active}:${mode}`}
                    page={page.number}
                    paragraphs={paragraphs}
                    settings={voice}
                    onSettingsChange={setVoice}
                    rates={[0.75, 1, 1.25, 1.5]}
                    repeat
                    revealCurrentChunk
                    startLabel={
                      mode === "teacher"
                        ? "Ouvir explicação do professor"
                        : readyOriginal
                          ? "Ouvir esta página"
                          : "Ouvir rascunho desta página"
                    }
                    readingDescription={
                      mode === "teacher"
                        ? "Explicação didática complementar da EDSON OFICINA. A leitura original permanece disponível separadamente."
                        : readyOriginal
                          ? "Leitura integral do texto conferido desta página, incluindo tabelas, códigos, valores, unidades, avisos e créditos. Ouvir não conclui o estudo."
                          : "Rascunho de reconhecimento automático, ainda não conferido. Pode conter erros em números, códigos e unidades. Consulte a imagem original."
                    }
                  />
                ) : (
                  <p className={styles.review}>
                    A transcrição desta página aguarda conferência. A leitura
                    original ficará disponível após essa revisão.
                  </p>
                )}
                {teacher.length > 0 && (
                  <section
                    className={styles.teacher}
                    aria-label="Explicação do professor"
                  >
                    <h3>Explicação do professor · EDSON OFICINA</h3>
                    {teacher.map((text, i) => (
                      <p key={i}>{text}</p>
                    ))}
                    <p>
                      Conteúdo didático complementar, separado do texto original
                      da fonte.
                    </p>
                  </section>
                )}

                <details className="academy-page-transcript">
                  <summary>
                    {readyOriginal
                      ? "Transcrição integral conferida"
                      : "Rascunho de transcrição · pendente de conferência"}
                  </summary>
                  {!readyOriginal && (
                    <p className={styles.review}>
                      Reconhecimento automático ainda não conferido: pode conter
                      erros em letras, códigos, números e unidades. Consulte a
                      imagem integral.
                    </p>
                  )}
                  <div className={styles.sourceText}>
                    {page.transcript.length ? (
                      page.transcript.map((text, i) => <p key={i}>{text}</p>)
                    ) : (
                      <p>Transcrição ainda não disponível.</p>
                    )}
                  </div>
                </details>
                {page.description && (
                  <details className="academy-page-transcript">
                    <summary>Descrição acessível da página</summary>
                    <p>{page.description}</p>
                  </details>
                )}
                {(page.guide || page.part) && (
                  <section
                    className="academy-note"
                    aria-label="Partes relacionadas"
                  >
                    <h3>Mesmo guia</h3>
                    {pages
                      .filter(
                        (p) =>
                          p.number !== page.number &&
                          Boolean(page.guide) &&
                          p.guide === page.guide &&
                          p.engine === page.engine &&
                          p.manufacturer === page.manufacturer,
                      )
                      .map((p) => (
                        <p key={p.number}>
                          <button
                            type="button"
                            className="text-link"
                            disabled={busy}
                            onClick={() => go(`pagina-${p.number}`)}
                          >
                            Página {p.number} · {p.title}
                            {p.part ? ` · Parte ${p.part}` : ""}
                          </button>
                        </p>
                      ))}
                  </section>
                )}
                <p className={styles.sourceNote}>
                  Antes de aplicar qualquer procedimento ou valor a um veículo,
                  confirme o código exato do motor e a documentação técnica
                  atualizada do fabricante. Preserve os alertas e a aplicação
                  indicada na fonte. Interrompa movimentações com risco de
                  colisão mecânica.
                </p>
                {course.number === 7 && (
                  <BudgetActivity
                    key={`budget-${page.number}`}
                    page={page.number}
                  />
                )}
              </>
            )}
            {(canStudy || currentQuestions.length > 0) && (
              <form
                className="academy-quiz"
                onSubmit={(e) => {
                  e.preventDefault();
                  void save("complete");
                }}
              >
                <h3>
                  {active === "avaliacao"
                    ? "Avaliação final"
                    : "Fixação e conclusão da página"}
                </h3>
                {currentQuestions.map((q) => (
                  <fieldset
                    key={q.id}
                    disabled={busy || !progress?.started || !canStudy}
                  >
                    <legend>{q.prompt}</legend>
                    <p className="credit">
                      Referência: página(s) {q.pages.join(", ")} desta aula.
                    </p>
                    {q.options.map((option, index) => (
                      <label className="check" key={index}>
                        <input
                          type="radio"
                          name={q.id}
                          value={index}
                          checked={answers[q.id] === index}
                          onChange={() =>
                            setAnswers((previous) => ({
                              ...previous,
                              [q.id]: index,
                            }))
                          }
                          required
                        />
                        {option}
                      </label>
                    ))}
                    {feedback.find((f) => f.id === q.id) && (
                      <p>
                        {feedback.find((f) => f.id === q.id)!.correct
                          ? "Resposta correta. "
                          : "Revise sua resposta. "}
                        {feedback.find((f) => f.id === q.id)!.explanation}
                      </p>
                    )}
                  </fieldset>
                ))}
                <label className="check">
                  <input
                    type="checkbox"
                    checked={studied || Boolean(completed)}
                    disabled={
                      !canStudy ||
                      busy ||
                      !progress?.started ||
                      Boolean(completed)
                    }
                    onChange={(e) => setStudied(e.target.checked)}
                  />
                  {active === "avaliacao"
                    ? "Revisei o conteúdo antes de enviar a avaliação."
                    : "Estudei a página, suas tabelas, figuras e alertas."}
                </label>
                <button
                  type="submit"
                  className="button"
                  disabled={
                    !canStudy ||
                    !progress?.started ||
                    busy ||
                    !(studied || completed)
                  }
                >
                  {busy
                    ? "Salvando…"
                    : currentQuestions.length
                      ? "Corrigir respostas e marcar estudado"
                      : "Marcar estudado"}
                </button>
                {completed && (
                  <p>Melhor resultado salvo: {completed.score}%.</p>
                )}
              </form>
            )}
            {progress?.eligible && (
              <section className="academy-note">
                <h2>Aula concluída</h2>
                <p>
                  Todas as etapas foram concluídas e a avaliação foi aprovada.
                </p>
                {effectiveHours === null && (
                  <p>
                    A carga horária aguarda validação pelo responsável para
                    emissão do certificado.
                  </p>
                )}
                <Link href="/aluno" className="text-link">
                  Ver meu progresso na Área do aluno →
                </Link>
              </section>
            )}
            <div className={styles.pageControls}>
              <button
                type="button"
                className="button secondary"
                disabled={busy || stepPosition <= 0}
                onClick={() => go(allSteps[stepPosition - 1])}
              >
                Página anterior
              </button>
              <button
                type="button"
                className="button secondary"
                disabled={busy || stepPosition >= allSteps.length - 1}
                onClick={() => go(allSteps[stepPosition + 1])}
              >
                {pagePosition === pages.length - 1 && hasExam
                  ? "Ir à avaliação"
                  : "Próxima página"}
              </button>
              <Link href="/academy/aulas" className="button secondary">
                Voltar à biblioteca
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
