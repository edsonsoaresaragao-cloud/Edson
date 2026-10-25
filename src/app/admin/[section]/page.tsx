import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeading, Empty } from "@/components/content";
import { ActionForm, Field, UploadForm } from "@/components/forms";
import { ContentEditor } from "@/components/content-editor";
import { CourseEditor } from "@/components/course-editor";
import { storageConfigured } from "@/lib/storage";
export default async function AdminSection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { section } = await params;
  const s = await searchParams;
  const actor = await currentUser();
  if (
    actor?.role !== "ADMIN" &&
    !["conteudos", "categorias", "cursos", "uploads"].includes(section)
  )
    redirect("/admin");
  if (section === "conteudos") {
    const [rows, categories, content] = await Promise.all([
      db.content.findMany({
        where: s.kind ? { kind: s.kind } : {},
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
      db.category.findMany({ orderBy: { name: "asc" } }),
      s.edit ? db.content.findUnique({ where: { id: s.edit } }) : null,
    ]);
    return (
      <>
        <PageHeading
          title="Conteúdos do portal"
          description="Cadastre, revise, publique, agende e oculte conteúdos pelo navegador."
        />
        <ContentEditor
          key={content?.id || "new"}
          content={content}
          categories={categories}
          kind={s.kind}
        />
        {content && (
          <ActionForm
            action="content-delete"
            submitLabel="Excluir definitivamente"
            className="card mt-5"
          >
            <input type="hidden" name="id" value={content.id} />
            <Field
              label="Para confirmar a exclusão, digite EXCLUIR"
              name="confirm"
              required
            />
          </ActionForm>
        )}
        <div className="records">
          {rows.map((c) => (
            <div className="record" key={c.id}>
              <div>
                <h3>{c.title}</h3>
                <p>
                  {c.kind} · {c.status} ·{" "}
                  {c.manualCategories
                    ? "Classificação manual"
                    : `Confiança automática: ${Math.round(c.confidence * 100)}%`}
                </p>
              </div>
              <Link href={"/admin/conteudos?edit=" + c.id}>Editar →</Link>
            </div>
          ))}
        </div>
        <p className="muted">
          Mostrando os 100 registros atualizados mais recentemente.
        </p>
      </>
    );
  }
  if (section === "categorias") {
    const cats = await db.category.findMany({ orderBy: { name: "asc" } });
    const edit = cats.find((c) => c.id === s.edit);
    return (
      <>
        <PageHeading title="Categorias e subcategorias" />
        <ActionForm
          key={edit?.id || "new"}
          action="category-save"
          className="card"
        >
          <input name="id" type="hidden" value={edit?.id || ""} />
          <Field name="name" label="Nome" value={edit?.name} required />
          <label>
            Descrição técnica
            <textarea
              name="description"
              defaultValue={edit?.description}
              required
            />
          </label>
          <label>
            Categoria superior
            <select name="parentId" defaultValue={edit?.parentId || ""}>
              <option value="">Categoria principal</option>
              {cats
                .filter((c) => c.id !== edit?.id)
                .map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
        </ActionForm>
        <div className="records">
          {cats.map((c) => (
            <div className="record" key={c.id}>
              <span>{c.name}</span>
              <Link href={"/admin/categorias?edit=" + c.id}>Editar →</Link>
            </div>
          ))}
        </div>
      </>
    );
  }
  if (section === "cursos") {
    const [courses, course, videos, courseCategories] = await Promise.all([
      db.course.findMany({
        include: { _count: { select: { enrollments: true } } },
      }),
      s.edit
        ? db.course.findUnique({
            where: { id: s.edit },
            include: {
              modules: {
                orderBy: { position: "asc" },
                include: {
                  lessons: {
                    orderBy: { position: "asc" },
                    include: { questions: true },
                  },
                },
              },
            },
          })
        : null,
      db.content.findMany({
        where: { kind: "VIDEO" },
        select: { id: true, title: true },
      }),
      db.category.findMany({ orderBy: { name: "asc" } }),
    ]);
    return (
      <>
        <PageHeading
          title="Treinamentos, cursos e aulas"
          description="Monte módulos, aulas e questionários. Os cursos são gratuitos."
        />
        <CourseEditor
          key={course?.id || "new"}
          course={course || undefined}
          videos={videos}
          categories={courseCategories}
        />
        <div className="records">
          {courses.map((c) => (
            <div className="record" key={c.id}>
              <div>
                <h3>{c.title}</h3>
                <p>
                  {c.status} · {c._count.enrollments} matrículas
                </p>
              </div>
              <Link href={"/admin/cursos?edit=" + c.id}>Editar →</Link>
            </div>
          ))}
        </div>
      </>
    );
  }
  if (section === "uploads") {
    const [contents, lessons, media] = await Promise.all([
      db.content.findMany({
        where: { kind: "VIDEO" },
        select: { id: true, title: true },
      }),
      db.lesson.findMany({ select: { id: true, title: true } }),
      db.media.findMany({ take: 100, orderBy: { createdAt: "desc" } }),
    ]);
    return (
      <>
        <PageHeading
          title="Arquivos próprios"
          description="Uploads para bucket privado. Vídeos passam por validação ffprobe e conversão HLS 360p/720p pelo worker."
        />
        {!storageConfigured() && (
          <p className="notice">
            Armazenamento S3 pendente. Configure endpoint, bucket e credenciais
            no servidor.
          </p>
        )}
        <UploadForm contents={contents} lessons={lessons} />
        <div className="records">
          {media.map((m) => (
            <div className="record" key={m.id}>
              <div>
                <h3>{m.originalName}</h3>
                <p>
                  {m.status} · {(m.size / 1024 / 1024).toFixed(1)} MB
                </p>
                {m.error && <p>{m.error}</p>}
              </div>
              <div>
                <span className="badge">{m.mimeType}</span>
                <details>
                  <summary>Excluir arquivo</summary>
                  <ActionForm
                    action="media-delete"
                    submitLabel="Excluir original e versões"
                  >
                    <input type="hidden" name="id" value={m.id} />
                    <Field
                      label="Digite EXCLUIR para confirmar"
                      name="confirm"
                      required
                    />
                  </ActionForm>
                </details>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }
  if (section === "youtube") {
    const channel = await db.channel.findFirst();
    return (
      <>
        <PageHeading
          title="Integração oficial com YouTube"
          description="Canal esperado: Oficina Brasil Oficial · UCkwom28UGBpkHFeTvOsLN8w"
        />
        <p className="notice">
          {process.env.YOUTUBE_API_KEY
            ? "Chave presente. A identidade do canal será validada pela API antes de cada importação."
            : "Configuração pendente: forneça YOUTUBE_API_KEY no servidor. Nenhum vídeo foi importado artificialmente."}
        </p>
        <div className="card mt-6">
          <details className="card mb-5">
            <summary>Explorar modo de demonstração (sem importação)</summary>
            <p>
              Exemplos fictícios apenas para demonstrar a classificação por
              metadados. Nenhum vídeo é criado ou atribuído ao canal.
            </p>
            <ul>
              <li>“Teste do sensor MAP” → Injeção eletrônica</li>
              <li>“Inspeção das pastilhas e ABS” → Freios e ABS</li>
              <li>“Radiador e válvula termostática” → Arrefecimento</li>
            </ul>
          </details>
          <h2>Sincronizar o acervo</h2>
          <p>
            Importação progressiva de até 50 vídeos por tarefa. Atualizar
            recentes consulta o início do acervo. Continuar importação usa a
            próxima página salva. O worker verifica vídeos removidos, privados e
            sem incorporação.
          </p>
          <ActionForm action="sync" submitLabel="Adicionar à fila">
            <label>
              Operação
              <select name="mode">
                <option value="latest">Atualizar vídeos recentes</option>
                <option value="backfill">Continuar importação do acervo</option>
              </select>
            </label>
          </ActionForm>
          <p className="muted mt-5">
            Quota local diária: {process.env.YOUTUBE_DAILY_QUOTA || 8000}{" "}
            unidades. Frequência automática:{" "}
            {process.env.YOUTUBE_SYNC_INTERVAL_MINUTES || 360} minutos. Cache no
            PostgreSQL; nenhuma cópia dos vídeos externos é armazenada.
          </p>
          <p>
            Última sincronização válida:{" "}
            {channel?.lastSyncAt?.toLocaleString("pt-BR", {
              timeZone: "America/Fortaleza",
            }) || "Nenhuma"}
          </p>
          <p>
            Próxima página do acervo:{" "}
            {channel?.nextPageToken
              ? "Disponível"
              : "Não registrada ou acervo percorrido"}
          </p>
        </div>
      </>
    );
  }
  if (section === "mensagens") {
    const rows = await db.contact.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return (
      <>
        <PageHeading title="Mensagens recebidas" />
        {!rows.length && <Empty title="Nenhuma mensagem" />}
        <div className="records">
          {rows.map((r) => (
            <div className="card" key={r.id}>
              <h3>{r.name}</h3>
              <p>
                {r.email} ·{" "}
                {r.createdAt.toLocaleString("pt-BR", {
                  timeZone: "America/Fortaleza",
                })}
              </p>
              <div className="prose">{r.message}</div>
            </div>
          ))}
        </div>
      </>
    );
  }
  if (section === "alunos") {
    const rows = await db.user.findMany({
      where: { role: "STUDENT" },
      include: { enrollments: { include: { course: true, progress: true } } },
      take: 100,
    });
    return (
      <>
        <PageHeading title="Alunos e matrículas" />
        {rows.map((u) => (
          <div className="card mb-4" key={u.id}>
            <h3>{u.name}</h3>
            <p>{u.email}</p>
            {u.enrollments.map((e) => (
              <p key={e.id}>
                {e.course.title} · {e.progress.length} aulas concluídas
              </p>
            ))}
          </div>
        ))}
        {!rows.length && <Empty title="Nenhum aluno cadastrado" />}
      </>
    );
  }
  if (section === "certificados") {
    const rows = await db.certificate.findMany({
      orderBy: { issuedAt: "desc" },
      take: 100,
    });
    return (
      <>
        <PageHeading title="Certificados emitidos" />
        {rows.map((c) => (
          <div className="record mb-3" key={c.id}>
            <div>
              <h3>{c.courseTitle}</h3>
              <p>
                {c.studentName} · {c.hours}h
              </p>
            </div>
            <Link href={"/certificados/" + c.code}>Validar / PDF →</Link>
          </div>
        ))}
        {!rows.length && <Empty title="Nenhum certificado emitido" />}
      </>
    );
  }
  if (section === "usuarios") {
    const rows = await db.user.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    return (
      <>
        <PageHeading
          title="Usuários e permissões"
          description="ADMIN administra todo o portal. STUDENT acessa seus próprios cursos. EDITOR gerencia conteúdos, categorias, cursos e arquivos, sem acesso aos dados pessoais e às credenciais."
        />
        <ActionForm
          action="user-create"
          className="card mb-5"
          submitLabel="Cadastrar usuário"
        >
          <h2>Novo aluno ou editor</h2>
          <Field label="Nome" name="name" required />
          <Field label="E-mail" name="email" type="email" required />
          <Field
            label="Senha temporária (mínimo 12 caracteres)"
            name="password"
            type="password"
            required
          />
          <label>
            Perfil
            <select name="role">
              <option value="STUDENT">Aluno</option>
              <option value="EDITOR">Editor</option>
            </select>
          </label>
        </ActionForm>
        {rows.map((u) => (
          <div className="card mb-4" key={u.id}>
            <h3>{u.name}</h3>
            <p>{u.email}</p>
            <ActionForm action="user-role" submitLabel="Atualizar permissão">
              <input name="id" type="hidden" value={u.id} />
              <label>
                Perfil
                <select name="role" defaultValue={u.role}>
                  <option value="STUDENT">Aluno</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="EDITOR">Editor de conteúdo</option>
                </select>
              </label>
            </ActionForm>
            <div className="mt-4">
              <ActionForm action="session-revoke" submitLabel="Revogar sessões">
                <input name="id" type="hidden" value={u.id} />
              </ActionForm>
            </div>
          </div>
        ))}
      </>
    );
  }
  if (section === "sincronizacoes") {
    const [syncs, jobs] = await Promise.all([
      db.syncRun.findMany({ take: 50, orderBy: { createdAt: "desc" } }),
      db.job.findMany({ take: 50, orderBy: { createdAt: "desc" } }),
    ]);
    return (
      <>
        <PageHeading title="Sincronizações e tarefas" />
        <h2>YouTube</h2>
        {syncs.map((r) => (
          <div className="record" key={r.id}>
            <div>
              <h3>{r.status}</h3>
              <p>
                {r.createdAt.toLocaleString("pt-BR", {
                  timeZone: "America/Fortaleza",
                })}{" "}
                · {r.imported} vídeos · {r.quotaUnits} unidades
              </p>
              <p>{r.message}</p>
            </div>
          </div>
        ))}
        {!syncs.length && <p>Nenhuma sincronização executada.</p>}
        <h2 className="mt-8">Fila de processamento</h2>
        {jobs.map((j) => (
          <div className="record mb-3" key={j.id}>
            <div>
              <h3>
                {j.type} · {j.status}
              </h3>
              <p>
                {j.attempts} tentativas · {j.error}
              </p>
            </div>
            {j.status === "FAILED" && (
              <ActionForm action="job-retry" submitLabel="Tentar novamente">
                <input name="id" type="hidden" value={j.id} />
              </ActionForm>
            )}
          </div>
        ))}
      </>
    );
  }
  if (section === "logs") {
    const rows = await db.audit.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    return (
      <>
        <PageHeading title="Auditoria administrativa" />
        {rows.map((r) => (
          <div className="record mb-3" key={r.id}>
            <div>
              <h3>{r.action}</h3>
              <p>
                Alvo: {r.target} · Responsável: {r.actorId}
              </p>
              <p>
                {r.createdAt.toLocaleString("pt-BR", {
                  timeZone: "America/Fortaleza",
                })}
              </p>
            </div>
          </div>
        ))}
      </>
    );
  }
  if (section === "configuracoes") {
    const required = [
      "DATABASE_URL",
      "SESSION_SECRET",
      "APP_URL",
      "YOUTUBE_API_KEY",
      "S3_ENDPOINT",
      "S3_PUBLIC_ENDPOINT",
      "S3_BUCKET",
      "S3_ACCESS_KEY",
      "S3_SECRET_KEY",
      "SMTP_HOST",
      "SMTP_FROM",
    ];
    return (
      <>
        <PageHeading
          title="Configuração das integrações"
          description="As credenciais ficam exclusivamente no servidor. O painel mostra presença, nunca valores secretos."
        />
        <div className="card">
          {required.map((name) => (
            <div className="record mb-2" key={name}>
              <code>{name}</code>
              <span className="badge">
                {process.env[name] ? "Configurado" : "Pendente"}
              </span>
            </div>
          ))}
          <h3 className="mt-6">Operação</h3>
          <p>
            O processo web atende o portal. O worker deve permanecer ativo para
            publicações agendadas, sincronizações e conversão de arquivos.
            Configure segredos nas variáveis protegidas da VPS e reinicie os
            processos após alterações.
          </p>
          <p>
            Marca: EDSON OFICINA · Fortaleza, CE · WhatsApp: +55 85 98140-8606.
          </p>
          <p>
            Consulte README.md, docs/DEPLOY.md e docs/ADMIN.md no repositório.
          </p>
        </div>
      </>
    );
  }
  notFound();
}
