"use client";
/* eslint-disable @next/next/no-img-element -- Página documental integral, com resolução nativa sob demanda. */
import { useRef, useState } from "react";
import styles from "./library.module.css";

export type LibraryVisualPage = {
  number: number;
  title: string;
  image: string;
  preview: string;
  description: string;
  width?: number;
  height?: number;
};

export function LibraryMaterialViewer({
  slug,
  page,
  total,
  pdfParts,
}: {
  slug: string;
  page: LibraryVisualPage;
  total: number;
  pdfParts?: { filename: string; firstPage: number; lastPage: number }[];
}) {
  const [zoom, setZoom] = useState(100);
  const [fullResolution, setFullResolution] = useState(false);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const url = (file: string) =>
    `/api/academy/library/${slug}/material/${encodeURIComponent(file)}`;
  const image = (expanded = false) => (
    <div
      className="academy-document-scroll"
      tabIndex={0}
      aria-label={`Página ${page.number}, região de leitura com rolagem`}
    >
      <img
        src={url(expanded || fullResolution ? page.image : page.preview)}
        loading="lazy"
        width={page.width || 1024}
        height={page.height || 1536}
        alt={
          page.description ||
          `Página ${page.number} integral — ${page.title}. Descrição da imagem pendente de revisão.`
        }
        style={{
          width: `${zoom}%`,
          maxWidth: "none",
          height: "auto",
          objectFit: "contain",
        }}
        onError={() => setFailed(true)}
      />
    </div>
  );
  const controls = (expanded = false) => (
    <div className="academy-viewer-tools">
      <label>
        Zoom
        <select
          aria-label={expanded ? "Zoom da página ampliada" : "Zoom da página"}
          value={zoom}
          onChange={(event) => {
            setZoom(Number(event.target.value));
            if (Number(event.target.value) > 100) setFullResolution(true);
          }}
        >
          {[50, 75, 100, 150, 200, 250, 300].map((value) => (
            <option value={value} key={value}>
              {value}%
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="button secondary"
        onClick={() => {
          if (expanded) dialog.current?.close();
          else {
            setFullResolution(true);
            setExpanded(true);
            dialog.current?.showModal();
          }
        }}
      >
        {expanded ? "Fechar ampliação" : "Ampliar página"}
      </button>
      {!expanded && !fullResolution && (
        <button
          type="button"
          className="button secondary"
          onClick={() => setFullResolution(true)}
        >
          Carregar resolução original
        </button>
      )}
    </div>
  );
  return (
    <section
      className="academy-material"
      aria-label="Visualizador do material técnico"
    >
      <h3>
        Material integral · página {page.number} de {total}
      </h3>
      <p>
        Fonte: <strong>Ponto do Motor</strong>. Fotografias, tabelas, legendas,
        alertas e créditos permanecem na página completa.
      </p>
      {controls()}
      {failed ? (
        <p role="alert">
          Não foi possível carregar a imagem.{" "}
          <button type="button" onClick={() => setFailed(false)}>
            Tentar novamente
          </button>
        </p>
      ) : (
        image()
      )}
      <p className="credit">
        Apenas a página selecionada é carregada. A ampliação utiliza a imagem em
        resolução original.
      </p>
      <div className={styles.materialLinks}>
        <a
          className="text-link"
          href={url(page.image)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir imagem integral ↗
        </a>
        {pdfParts?.map((part, index) => (
          <a
            className="text-link"
            href={url(part.filename)}
            key={part.filename}
          >
            Baixar PDF — Parte {index + 1} (páginas {part.firstPage}–
            {part.lastPage})
          </a>
        ))}
        <a className="text-link" href={url("original.pdf")}>
          Baixar PDF original completo
        </a>
      </div>
      <dialog
        ref={dialog}
        className="academy-document-dialog"
        aria-label={`Página ${page.number} ampliada`}
        onClose={() => setExpanded(false)}
      >
        {controls(true)}
        {expanded && image(true)}
        <p>
          Ponto do Motor · Página {page.number} de {total} · Pressione Esc para
          fechar.
        </p>
      </dialog>
    </section>
  );
}
