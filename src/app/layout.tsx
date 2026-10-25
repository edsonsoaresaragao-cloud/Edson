import type { Metadata } from "next";
import Link from "next/link";
import {
  Wrench,
  ArrowUpRight,
  MessageCircle,
  UserRound,
  Menu,
} from "lucide-react";
import { ThemeToggle } from "@/components/forms";
import "./globals.css";
import { JsonLd } from "@/components/jsonld";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "EDSON OFICINA — Conhecimento que movimenta a mecânica",
    template: "%s | EDSON OFICINA",
  },
  description:
    "Portal brasileiro de conhecimento automotivo. Peças, manutenção, diagnósticos educativos, vídeos técnicos e treinamentos.",
  openGraph: { locale: "pt_BR", type: "website", siteName: "EDSON OFICINA" },
};
const nav = [
  ["/videos", "Vídeos"],
  ["/categorias", "Sistemas"],
  ["/pecas", "Peças"],
  ["/diagnostico", "Diagnóstico"],
  ["/artigos", "Conteúdos"],
  ["/academy", "Academy"],
];
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.theme=localStorage.getItem('edson-theme')||'light'}catch(e){}",
          }}
        />
      </head>
      <body>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "EDSON OFICINA",
            url: process.env.APP_URL || "http://localhost:3000",
            description: "Portal brasileiro de conhecimento automotivo",
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+55-85-98140-8606",
              contactType: "Atendimento",
              availableLanguage: "Portuguese",
            },
          }}
        />
        <a className="skip-link" href="#conteudo">
          Pular para conteúdo
        </a>
        <div className="topline">
          <div className="container">
            <span>
              FORTALEZA, CEARÁ <span className="dot">●</span> CONHECIMENTO PARA
              TODO O BRASIL
            </span>
            <Link href="/sobre">
              Nossa oficina é o conhecimento <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
        <header className="header">
          <div className="container header-inner">
            <Link href="/" className="brand" aria-label="Edson Oficina início">
              <span className="brand-symbol">
                <Wrench size={25} />
              </span>
              <span>
                EDSON
                <span className="brand-small">
                  OFICINA<span className="orange">.</span>
                </span>
              </span>
            </Link>
            <nav className="desktop-nav" aria-label="Principal">
              {nav.map(([href, label]) => (
                <Link key={href} href={href}>
                  {label}
                  {label === "Academy" && <span className="new-dot" />}
                </Link>
              ))}
            </nav>
            <div className="header-actions">
              <ThemeToggle />
              <Link href="/aluno" className="student-link">
                <UserRound size={16} /> Área do aluno
              </Link>
              <details className="mobile-menu">
                <summary aria-label="Abrir menu">
                  <Menu />
                </summary>
                <nav>
                  {nav.map(([href, label]) => (
                    <Link key={href} href={href}>
                      {label}
                    </Link>
                  ))}
                  <Link href="/aluno">Área do aluno</Link>
                </nav>
              </details>
            </div>
          </div>
        </header>
        <main id="conteudo">{children}</main>
        <footer>
          <div className="container footer-grid">
            <div>
              <Link className="brand" href="/">
                <Wrench className="orange" />
                <span>
                  EDSON OFICINA<span className="orange">.</span>
                </span>
              </Link>
              <p>Conhecimento que movimenta a mecânica.</p>
              <p>Fortaleza, Ceará, Brasil.</p>
            </div>
            <div>
              <h3>Explore</h3>
              <Link href="/videos">Vídeos técnicos</Link>
              <Link href="/guias">Guias de manutenção</Link>
              <Link href="/veiculos">Marcas e modelos</Link>
              <Link href="/academy">Academy</Link>
            </div>
            <div>
              <h3>Institucional</h3>
              <Link href="/sobre">Quem somos</Link>
              <Link href="/contato">Contato</Link>
              <Link href="/privacidade">Privacidade</Link>
              <Link href="/termos">Termos de uso</Link>
              <Link href="/admin">Administração</Link>
            </div>
            <div>
              <h3>Vamos conversar</h3>
              <p>+55 85 98140-8606</p>
              <a
                href="https://wa.me/5585981408606?text=Ol%C3%A1%2C%20Edson!%20Conheci%20o%20site%20Edson%20Oficina%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar no WhatsApp ↗
              </a>
            </div>
          </div>
          <div className="container footer-bottom">
            <span>© {new Date().getFullYear()} EDSON OFICINA</span>
            <span>
              Conteúdo educativo. Toda intervenção exige avaliação técnica.
            </span>
          </div>
        </footer>
        <a
          className="whatsapp"
          href="https://wa.me/5585981408606?text=Ol%C3%A1%2C%20Edson!%20Conheci%20o%20site%20Edson%20Oficina%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
          aria-label="Conversar com Edson pelo WhatsApp"
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={25} />
        </a>
      </body>
    </html>
  );
}
