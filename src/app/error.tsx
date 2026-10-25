"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container page-content">
      <h1 className="mt-10">Não foi possível carregar esta página.</h1>
      <p>Verifique a disponibilidade dos serviços e tente novamente.</p>
      <button className="button" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
