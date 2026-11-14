"use client";
/* eslint-disable @next/next/no-img-element -- Renderização integral da página documental. */
import { useRef, useState } from "react";
import {
  ADAPTED_PDF,
  materialUrl,
  type SourcePage,
} from "@/lib/academy/checklist/content";
export function ChecklistMaterialViewer({ page }: { page: SourcePage }) {
  const [zoom, setZoom] = useState(100),
    [error, setError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const image = () => (
    <div
      className="academy-document-scroll"
      tabIndex={0}
      aria-label={`Página ${page.page}, região de leitura com rolagem`}
    >
      <img
        src={materialUrl(`pagina-${String(page.page).padStart(2, "0")}.png`)}
        width={1024}
        height={1536}
        style={{
          width: `${zoom}%`,
          maxWidth: "none",
          height: "auto",
          objectFit: "contain",
        }}
        alt={`Página ${page.page} de 4 — ${page.title}. Fonte Ponto do Motor; imagem integral, avisos e créditos preservados.`}
        onError={() => setError(true)}
      />
    </div>
  );
  const tools = (expanded = false) => (
    <div className="academy-viewer-tools">
      <label>
        Zoom
        <select
          aria-label={expanded ? "Zoom da página ampliada" : "Zoom da página"}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        >
          {[50, 75, 100, 150, 200, 250, 300].map((n) => (
            <option key={n} value={n}>
              {n}%
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="button secondary"
        onClick={() =>
          expanded ? dialog.current?.close() : dialog.current?.showModal()
        }
      >
        {expanded ? "Fechar ampliação" : "Ampliar página"}
      </button>
    </div>
  );
  return (
    <section
      className="academy-material"
      aria-label="Visualizador do material técnico"
    >
      <h3>Material técnico · página {page.page} de 4</h3>
      <p>
        Fonte: <strong>Ponto do Motor</strong>. Cabeçalho adaptado para AULA 02;
        página completa, fotografias, legendas, avisos e referências
        preservados.
      </p>
      {tools()}
      {error ? (
        <p role="alert">
          Não foi possível carregar a página.{" "}
          <button type="button" onClick={() => setError(false)}>
            Tentar novamente
          </button>
        </p>
      ) : (
        image()
      )}
      <p className="credit">
        Imagem nativa: 1024 × 1536 pixels. Use o zoom e a rolagem para ler toda
        a página.
      </p>
      <a className="button secondary" href={materialUrl(ADAPTED_PDF)}>
        Baixar material adaptado completo · 4 páginas
      </a>
      <dialog
        ref={dialog}
        className="academy-document-dialog"
        aria-label={`Página ${page.page} ampliada`}
      >
        {tools(true)}
        {image()}
        <p>
          Fonte: Ponto do Motor · Página {page.page} de 4 · Pressione Esc para
          fechar.
        </p>
      </dialog>
    </section>
  );
}
