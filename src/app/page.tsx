import Link from "next/link";
import { RecentVideos } from "@/components/recent-videos";
import { recentContentOrder } from "@/lib/video-presentation";
import { EngineHero } from "@/components/engine-hero";
import {
  ArrowRight,
  ArrowUpRight,
  Wrench,
  Cpu,
  Activity,
  Zap,
  Disc3,
  Wind,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Play,
} from "lucide-react";
import { db } from "@/lib/db";
import { publicWhere } from "@/lib/content";
import { SearchBox } from "@/components/forms";
import { ContentCard, Empty, SectionTitle } from "@/components/content";
import { ContactForm } from "@/components/contact";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [videos, parts, diagnoses, articles, courses] = await Promise.all([
    db.content.findMany({
      where: { ...publicWhere, kind: "VIDEO" },
      take: 12,
      orderBy: recentContentOrder,
    }),
    db.content.findMany({ where: { ...publicWhere, kind: "PART" }, take: 3 }),
    db.content.findMany({
      where: { ...publicWhere, kind: "DIAGNOSIS" },
      take: 3,
    }),
    db.content.findMany({
      where: { ...publicWhere, kind: "ARTICLE" },
      take: 3,
    }),
    db.course.findMany({ where: { status: "PUBLISHED" }, take: 3 }),
  ]);
  const systems = [
    ["Motor", "motor-e-componentes-internos", Wrench],
    ["Injeção eletrônica", "injecao-eletronica", Cpu],
    ["Scanner e diagnóstico", "diagnostico-com-scanner", Activity],
    ["Elétrica", "eletrica-automotiva", Zap],
    ["Freios e ABS", "freios-e-abs", Disc3],
    ["Arrefecimento", "arrefecimento", Wind],
  ] as const;
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span /> PARA QUEM VIVE A MECÂNICA
            </div>
            <h1>
              Conhecimento que
              <br />
              movimenta a <em>mecânica.</em>
            </h1>
            <p>
              Seu portal de conhecimento automotivo. Entenda os sistemas,
              aprimore o diagnóstico e evolua a cada reparo.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/videos">
                <Play size={16} /> Explorar vídeos técnicos{" "}
                <ArrowUpRight size={17} />
              </Link>
              <Link className="hero-text-link" href="/academy">
                Conheça a Academy <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-notes">
              <span>
                <ShieldCheck size={17} /> Conteúdo educativo
              </span>
              <span>
                <Wrench size={17} /> Da teoria à oficina
              </span>
            </div>
          </div>
          <div className="hero-visual hero-visual-realistic">
            <EngineHero />
            <div className="hero-stamp">
              <span className="orange">●</span> CONHECER. DIAGNOSTICAR. EVOLUIR.
            </div>
          </div>
        </div>
        <div className="hero-bottom">
          <div className="container">
            <span>SEU PRÓXIMO APRENDIZADO COMEÇA AQUI</span>
            <span>
              01 — EXPLORE O CONHECIMENTO <ArrowRight size={15} />
            </span>
          </div>
        </div>
      </section>
      <div className="container search-strip">
        <SearchBox />
        <span>Busque por sistema, peça, sintoma ou serviço.</span>
      </div>
      <div className="container">
        <section className="section">
          <SectionTitle
            eyebrow="ENCONTRE SEU CAMINHO"
            title="Cada sistema, um novo conhecimento."
            href="/categorias"
            label="Ver os 34 sistemas"
          />
          <div className="systems">
            {systems.map(([title, slug, Icon], i) => (
              <Link key={slug} href={"/categorias/" + slug}>
                <div className="system-top">
                  <Icon size={27} />
                  <span>0{i + 1}</span>
                </div>
                <h3>{title}</h3>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        </section>
        <section className="section">
          <SectionTitle
            eyebrow="APERTE O PLAY. AMPLIE SEU REPERTÓRIO."
            title="Novidades na bancada"
            href="/videos"
          />
          {!process.env.YOUTUBE_API_KEY && (
            <p className="integration-note">
              <span className="status-dot" />
              Integração YouTube em configuração. Vídeos reais aparecerão após a
              conexão com a API oficial.
            </p>
          )}
          {videos.length ? (
            <RecentVideos
              videos={videos.map((v) => ({
                id: v.id,
                slug: v.slug,
                title: v.title,
                summary: v.summary,
                author: v.author,
                imageUrl: v.imageUrl,
                categories: v.categorySlugs,
                duration: v.duration,
                metadata: v.metadata,
              }))}
            />
          ) : (
            <Empty
              title="Uma biblioteca técnica está a caminho"
              text="A importação do canal Oficina Brasil Oficial aguarda configuração. Você já pode explorar os guias e a biblioteca de peças."
            />
          )}
        </section>
        <section className="academy-banner">
          <div>
            <span className="eyebrow">EDSON OFICINA ACADEMY</span>
            <h2>
              Experiência na prática.
              <br />
              Conhecimento para ir além.
            </h2>
            <p>
              Treinamentos gratuitos, aprendizado no seu ritmo e progresso salvo
              na sua conta.
            </p>
            <Link className="button" href="/academy">
              Explorar treinamentos <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="academy-art">
            <GraduationCap size={95} strokeWidth={1} />
            <span>
              APRENDA
              <br />
              <strong>EVOLUA.</strong>
            </span>
          </div>
        </section>
        <section className="section">
          <SectionTitle
            eyebrow="ENTENDA O QUE FAZ CADA PEÇA"
            title="Por dentro da mecânica"
            href="/pecas"
          />
          <div className="grid three">
            {parts.map((p) => (
              <ContentCard key={p.id} item={p} />
            ))}
          </div>
        </section>
        <section className="section diagnosis-section">
          <div>
            <span className="eyebrow">DO SINTOMA À INVESTIGAÇÃO</span>
            <h2>
              Um bom diagnóstico
              <br />
              começa com informação.
            </h2>
            <p>
              Explore causas possíveis e verificações educativas. A confirmação
              exige testes e avaliação profissional.
            </p>
            <Link href="/diagnostico" className="text-link">
              Explorar diagnóstico <ArrowRight size={17} />
            </Link>
          </div>
          <div className="symptom-list">
            {diagnoses.map((d) => (
              <Link key={d.id} href={"/diagnostico/" + d.slug}>
                <Activity size={20} />
                <span>
                  {d.title}
                  <small>{d.summary}</small>
                </span>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
        </section>
        <section className="section">
          <SectionTitle
            eyebrow="LEITURA QUE AGREGA À ROTINA"
            title="Conteúdo de oficina, para oficina"
            href="/artigos"
          />
          <div className="grid three">
            {articles.map((a) => (
              <ContentCard key={a.id} item={a} />
            ))}
            <Link href="/guias" className="editorial-card">
              <BookOpen size={35} />
              <span className="eyebrow">MANUTENÇÃO PREVENTIVA</span>
              <h3>
                Organização hoje.
                <br />
                Mais confiança amanhã.
              </h3>
              <p>Consulte nossos guias educativos de manutenção.</p>
              <ArrowUpRight />
            </Link>
            <Link
              href="/categorias/manutencao-e-produtividade-de-frotas"
              className="editorial-card dark"
            >
              <Wrench size={35} />
              <span className="eyebrow">GESTÃO E FROTAS</span>
              <h3>
                Conhecimento também
                <br />é produtividade.
              </h3>
              <p>
                Explore conteúdos sobre processos, registros e manutenção de
                frotas.
              </p>
              <ArrowUpRight />
            </Link>
          </div>
        </section>
        {courses.length > 0 && (
          <section className="section">
            <SectionTitle
              title="Treinamentos disponíveis"
              href="/treinamentos"
            />
            <div className="grid three">
              {courses.map((c) => (
                <Link className="card" href={"/cursos/" + c.slug} key={c.id}>
                  <GraduationCap />
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                  <span>{c.hours}h · Gratuito</span>
                </Link>
              ))}
            </div>
          </section>
        )}
        <section className="section contact-section">
          <div>
            <span className="eyebrow">CONEXÃO QUE FAZ A DIFERENÇA</span>
            <h2>
              Vamos falar
              <br />
              de mecânica?
            </h2>
            <p>
              Dúvidas sobre o portal, sugestões de conteúdo ou interesse em
              treinamentos. Sua mensagem chega ao responsável.
            </p>
            <a className="text-link" href="https://wa.me/5585981408606">
              Conversar pelo WhatsApp <ArrowUpRight size={17} />
            </a>
          </div>
          <ContactForm />
        </section>
      </div>
    </>
  );
}
