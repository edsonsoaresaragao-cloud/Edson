"use client";
/* eslint-disable @next/next/no-img-element -- Páginas integrais do PDF, sem recorte/otimização destrutiva. */
import { useRef, useState } from "react";
import { studySteps } from "@/lib/academy/content";
const pages = [
  "Capa",
  ...studySteps.filter((s) => s.kind === "manufacturer").map((s) => s.title),
];
export const materialUrl = (file: string) =>
  `/api/academy/aula-01/material/${file}`;
export function MaterialViewer({ initialPage = 1 }: { initialPage?: number }) {
  const [page, setPage] = useState(initialPage),
    [zoom, setZoom] = useState(100),
    [error, setError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const src = materialUrl(`page-${String(page).padStart(2, "0")}.png`);
  function move(value: number) {
    setPage(value);
    setZoom(100);
    setError(false);
  }
  function toolbar(expanded = false) {
    return (
      <div className="academy-viewer-tools">
        <button
          type="button"
          className="button secondary"
          disabled={page === 1}
          onClick={() => move(page - 1)}
        >
          Página anterior
        </button>
        <label>
          Página do material
          <select
            aria-label={expanded ? "Página ampliada" : "Página do material"}
            value={page}
            onChange={(e) => move(Number(e.target.value))}
          >
            {pages.map((name, i) => (
              <option value={i + 1} key={name}>
                {i + 1} / 11 · {name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button secondary"
          disabled={page === 11}
          onClick={() => move(page + 1)}
        >
          Próxima página
        </button>
        <label>
          Zoom
          <select
            aria-label={expanded ? "Zoom ampliado" : "Zoom da página"}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          >
            {[50, 75, 100, 150, 200, 250, 300].map((n) => (
              <option value={n} key={n}>
                {n}%
              </option>
            ))}
          </select>
        </label>
        {expanded ? (
          <button
            type="button"
            className="button"
            onClick={() => dialog.current?.close()}
          >
            Fechar ampliação
          </button>
        ) : (
          <button
            type="button"
            className="button"
            onClick={() => dialog.current?.showModal()}
          >
            Ampliar página
          </button>
        )}
      </div>
    );
  }
  function image() {
    return (
      <div
        className="academy-document-scroll"
        tabIndex={0}
        aria-label={`Página ${page}, região de leitura com rolagem`}
      >
        <img
          key={src}
          src={src}
          width={1024}
          height={1536}
          style={{ width: `${zoom}%`, maxWidth: "none", height: "auto" }}
          alt={`Página ${page} de 11 — ${pages[page - 1]}. Material Ponto do Motor; tabela, legendas, alertas, dicas e créditos integrais.`}
          onError={() => setError(true)}
        />
      </div>
    );
  }
  return (
    <section
      className="academy-material"
      aria-label="Visualizador do material técnico"
    >
      <h3>Material técnico · página {page} de 11</h3>
      <p>
        Fonte: <strong>Ponto do Motor</strong>. Cabeçalho adaptado; conteúdo
        completo da página preservado. Use o zoom para ler tabelas e rodapés.
      </p>
      {toolbar()}
      {error ? (
        <p role="alert">
          Não foi possível carregar a página.{" "}
          <button
            type="button"
            onClick={() => {
              setError(false);
              move(page);
            }}
          >
            Tentar novamente
          </button>
        </p>
      ) : (
        image()
      )}
      <p className="credit">
        {pages[page - 1]} · Ordem original do documento · Imagem nativa de 1024
        × 1536 pixels, sem recorte.
      </p>
      <a className="button secondary" href={materialUrl("aula-01.pdf")}>
        Baixar material adaptado completo · 11 páginas
      </a>
      <dialog
        ref={dialog}
        className="academy-document-dialog"
        aria-label="Página técnica ampliada"
      >
        {toolbar(true)}
        {image()}
        <p>
          Fonte: Ponto do Motor · Página {page} de 11 · Pressione Esc para
          fechar.
        </p>
      </dialog>
    </section>
  );
}
