"use client";
import { useState } from "react";
import { ActionForm, Field } from "./forms";
type Q = { prompt: string; options: string[]; correctIndex: number };
type L = {
  title: string;
  body: string;
  youtubeId?: string | null;
  videoContentId?: string | null;
  questions: Q[];
};
type M = { title: string; lessons: L[] };
type Course = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  hours: number;
  passingScore: number;
  status: string;
  objectives: string;
  audience: string;
  prerequisites: string;
  modules: M[];
  imageUrl: string;
  categorySlugs: string[];
};
const emptyLesson = (): L => ({
  title: "",
  body: "",
  youtubeId: "",
  videoContentId: "",
  questions: [],
});
export function CourseEditor({
  course,
  videos = [],
  categories = [],
}: {
  course?: Course;
  videos?: { id: string; title: string }[];
  categories?: { slug: string; name: string }[];
}) {
  const [modules, setModules] = useState<M[]>(
    course?.modules || [{ title: "Módulo 1", lessons: [emptyLesson()] }],
  );
  const update = (fn: (draft: M[]) => void) =>
    setModules((prev) => {
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
  return (
    <ActionForm
      action="course-save"
      submitLabel="Salvar curso e aulas"
      className="card"
    >
      <input type="hidden" name="id" value={course?.id || ""} />
      <input type="hidden" name="structure" value={JSON.stringify(modules)} />
      <h2>{course ? "Editar curso" : "Criar treinamento gratuito"}</h2>
      <div className="form-grid">
        <Field
          label="Nome do curso"
          name="title"
          value={course?.title}
          required
        />
        <Field
          label="Instrutor"
          name="instructor"
          value={course?.instructor}
          required
        />
        <Field
          label="Carga horária (horas)"
          name="hours"
          type="number"
          value={course?.hours || 1}
          min={1}
          max={2000}
        />
        <Field
          label="Nota mínima (%)"
          name="passingScore"
          type="number"
          value={course?.passingScore || 70}
          min={1}
          max={100}
        />
      </div>
      <label>
        Descrição
        <textarea
          name="description"
          defaultValue={course?.description}
          required
        />
      </label>
      <Field label="Objetivos" name="objectives" value={course?.objectives} />
      <Field label="Público-alvo" name="audience" value={course?.audience} />
      <Field
        label="Pré-requisitos"
        name="prerequisites"
        value={course?.prerequisites}
      />
      <Field
        label="Capa própria/licenciada (HTTPS)"
        name="imageUrl"
        type="url"
        value={course?.imageUrl}
      />
      <fieldset>
        <legend>Sistemas relacionados</legend>
        <div className="grid two">
          {categories.map((cat) => (
            <label className="check" key={cat.slug}>
              <input
                type="checkbox"
                name="categories"
                value={cat.slug}
                defaultChecked={course?.categorySlugs.includes(cat.slug)}
              />
              {cat.name}
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        Status
        <select name="status" defaultValue={course?.status || "DRAFT"}>
          <option value="DRAFT">Rascunho</option>
          <option value="PUBLISHED">Publicado</option>
          <option value="HIDDEN">Oculto</option>
        </select>
      </label>
      {modules.map((m, mi) => (
        <fieldset key={mi}>
          <legend>Módulo {mi + 1}</legend>
          <label>
            Nome do módulo
            <input
              value={m.title}
              required
              onChange={(e) =>
                update((d) => {
                  d[mi].title = e.target.value;
                })
              }
            />
          </label>
          {m.lessons.map((l, li) => (
            <div className="lesson-editor" key={li}>
              <h3>Aula {li + 1}</h3>
              <label>
                Título
                <input
                  value={l.title}
                  required
                  onChange={(e) =>
                    update((d) => {
                      d[mi].lessons[li].title = e.target.value;
                    })
                  }
                />
              </label>
              <label>
                Conteúdo educativo
                <textarea
                  value={l.body}
                  required
                  onChange={(e) =>
                    update((d) => {
                      d[mi].lessons[li].body = e.target.value;
                    })
                  }
                />
              </label>
              <label>
                ID YouTube autorizado (opcional)
                <input
                  value={l.youtubeId || ""}
                  onChange={(e) =>
                    update((d) => {
                      d[mi].lessons[li].youtubeId = e.target.value;
                    })
                  }
                />
              </label>
              <label>
                Vídeo próprio
                <select
                  value={l.videoContentId || ""}
                  onChange={(e) =>
                    update((d) => {
                      d[mi].lessons[li].videoContentId = e.target.value;
                    })
                  }
                >
                  <option value="">Nenhum</option>
                  {videos.map((v) => (
                    <option value={v.id} key={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
              </label>
              {l.questions.map((q, qi) => (
                <fieldset key={qi}>
                  <legend>Pergunta {qi + 1}</legend>
                  <label>
                    Enunciado
                    <input
                      required
                      value={q.prompt}
                      onChange={(e) =>
                        update((d) => {
                          d[mi].lessons[li].questions[qi].prompt =
                            e.target.value;
                        })
                      }
                    />
                  </label>
                  {q.options.map((o, oi) => (
                    <label key={oi}>
                      Alternativa {oi + 1}
                      <input
                        required
                        value={o}
                        onChange={(e) =>
                          update((d) => {
                            d[mi].lessons[li].questions[qi].options[oi] =
                              e.target.value;
                          })
                        }
                      />
                    </label>
                  ))}
                  <label>
                    Alternativa correta
                    <select
                      value={q.correctIndex}
                      onChange={(e) =>
                        update((d) => {
                          d[mi].lessons[li].questions[qi].correctIndex = Number(
                            e.target.value,
                          );
                        })
                      }
                    >
                      {q.options.map((_, i) => (
                        <option value={i} key={i}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() =>
                      update((d) => {
                        d[mi].lessons[li].questions[qi].options.push("");
                      })
                    }
                  >
                    Adicionar alternativa
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      update((d) => {
                        d[mi].lessons[li].questions.splice(qi, 1);
                      })
                    }
                  >
                    Remover pergunta
                  </button>
                </fieldset>
              ))}
              <div className="actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    update((d) => {
                      d[mi].lessons[li].questions.push({
                        prompt: "",
                        options: ["", ""],
                        correctIndex: 0,
                      });
                    })
                  }
                >
                  Adicionar pergunta
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    update((d) => {
                      d[mi].lessons.splice(li, 1);
                    })
                  }
                >
                  Remover aula
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              update((d) => {
                d[mi].lessons.push(emptyLesson());
              })
            }
          >
            + Adicionar aula
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              update((d) => {
                d.splice(mi, 1);
              })
            }
          >
            Remover módulo
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="button secondary"
        onClick={() =>
          update((d) => {
            d.push({ title: "", lessons: [emptyLesson()] });
          })
        }
      >
        + Adicionar módulo
      </button>
      <p className="muted">
        Apostilas e vídeos podem ser anexados às aulas após salvar. Cursos com
        matrículas preservam a estrutura; crie uma nova edição para alterá-la.
      </p>
    </ActionForm>
  );
}
