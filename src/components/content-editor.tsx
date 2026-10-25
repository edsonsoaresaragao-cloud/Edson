import type { Content, Category } from "@prisma/client";
import { ActionForm, Field } from "./forms";
import { kindLabels } from "@/lib/catalog";
export function ContentEditor({
  content,
  categories,
  kind,
}: {
  content?: Content | null;
  categories: Category[];
  kind?: string;
}) {
  return (
    <ActionForm
      action="content-save"
      submitLabel="Salvar conteúdo"
      className="card"
    >
      <h2>{content ? "Editar conteúdo" : "Novo conteúdo"}</h2>
      <input name="id" type="hidden" value={content?.id || ""} />
      <div className="form-grid">
        <label>
          Tipo
          <select name="kind" defaultValue={content?.kind || kind || "ARTICLE"}>
            {Object.entries(kindLabels).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select name="status" defaultValue={content?.status || "DRAFT"}>
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="SCHEDULED">Agendado</option>
            <option value="HIDDEN">Oculto</option>
          </select>
        </label>
        <label>
          Visibilidade
          <select
            name="visibility"
            defaultValue={content?.visibility || "PUBLIC"}
          >
            <option value="PUBLIC">Público</option>
            <option value="PRIVATE">Somente aulas com matrícula</option>
          </select>
        </label>
        <label>
          Dificuldade
          <select
            name="difficulty"
            defaultValue={content?.difficulty || "BASIC"}
          >
            <option value="BASIC">Básico</option>
            <option value="INTERMEDIATE">Intermediário</option>
            <option value="ADVANCED">Avançado</option>
          </select>
        </label>
        <Field
          label="Instrutor"
          name="instructor"
          value={content?.instructor}
        />
        <Field label="Título" name="title" value={content?.title} required />
        <Field
          label="Autor / canal de origem"
          name="author"
          value={content?.author || "Edson"}
          required
        />
      </div>
      <label>
        Resumo
        <textarea
          name="summary"
          defaultValue={content?.summary}
          required
          maxLength={700}
        />
      </label>
      <label>
        Conteúdo técnico, função, sintomas, manutenção ou referências
        <textarea name="body" defaultValue={content?.body} rows={10} />
      </label>
      <div className="form-grid">
        <Field
          label="Imagem de capa própria/licenciada (HTTPS)"
          name="imageUrl"
          type="url"
          value={content?.imageUrl}
        />
        <Field
          label="Fonte ou referência (HTTPS)"
          name="sourceUrl"
          type="url"
          value={content?.sourceUrl}
        />
        <Field
          label="ID YouTube autorizado (11 caracteres)"
          name="youtubeId"
          value={content?.youtubeId || ""}
        />
        <Field
          label="Agendar publicação (UTC)"
          name="publishAt"
          type="datetime-local"
          value={content?.publishAt?.toISOString().slice(0, 16) || ""}
        />
        <Field
          label="Marca com aplicação confirmada"
          name="brand"
          value={content?.brand}
        />
        <Field
          label="Modelo com aplicação confirmada"
          name="vehicleModel"
          value={content?.vehicleModel}
        />
        <Field
          label="Ano confirmado"
          name="year"
          type="number"
          value={content?.year || ""}
          min={1900}
          max={2100}
        />
        <Field
          label="Tags (separadas por vírgula)"
          name="tags"
          value={content?.tags.join(", ")}
        />
      </div>
      <fieldset>
        <legend>
          Categorias (correção manual preservada nas sincronizações)
        </legend>
        <div className="grid two">
          {categories.map((cat) => (
            <label className="check" key={cat.id}>
              <input
                type="checkbox"
                name="categories"
                value={cat.slug}
                defaultChecked={content?.categorySlugs.includes(cat.slug)}
              />
              {cat.name}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="muted">
        Não informe aplicações não confirmadas. A classificação automática
        sugere categorias por metadados; não analisa o conteúdo audiovisual.
        Para vídeos próprios, salve o cadastro e envie o arquivo em “Enviar
        vídeo”. A visibilidade privada exige vínculo com uma aula e matrícula.
        Arquivos associados diretamente a aulas sempre exigem matrícula.
      </p>
    </ActionForm>
  );
}
