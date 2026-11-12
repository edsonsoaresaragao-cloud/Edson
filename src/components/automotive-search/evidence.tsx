import type {
  SearchResponse,
  TechnicalAnswer,
} from "@/lib/automotive-search/contracts";
type Fact = TechnicalAnswer["facts"][number];
export function DiagnosticEvidence({
  data,
  codes = false,
}: {
  data: SearchResponse;
  codes?: boolean;
}) {
  const facts = data.answer?.facts || [];
  function render(categories: string[]) {
    const selected = facts.filter((f) => categories.includes(f.category));
    return selected.length ? (
      selected.map((f, i) => (
        <article key={i}>
          <p>{f.text}</p>
          <small>
            {f.status === "hypothesis"
              ? "Hipótese a verificar"
              : f.status === "unconfirmed"
                ? "Informação não confirmada"
                : "Informação geral citada"}
          </small>
          <p>{links(f)}</p>
        </article>
      ))
    ) : (
      <p>
        Não informado nas fontes consultadas. Confirme na documentação da versão
        do veículo.
      </p>
    );
  }
  function links(f: Fact) {
    return f.sourceIds.map((id) => {
      const source = data.sources.find((s) => s.id === id);
      return source ? (
        <a key={id} href={source.url} target="_blank" rel="noopener noreferrer">
          [{source.title}] ↗{" "}
        </a>
      ) : null;
    });
  }
  const dtcs = [
    ...new Set(data.query.q.match(/\b[PCBU][0-9A-F]{4}\b/gi) || []),
  ];
  const sections = codes
    ? [
        ["Descrição e significado técnico", ["codes"]],
        ["Possíveis causas", ["diagnosis"]],
        ["Sintomas relacionados", ["symptoms"]],
        ["Componentes citados nas fontes", ["identification"]],
        ["Testes recomendados", ["tests", "decision"]],
      ]
    : [
        ["2. Funcionamento do sistema", ["function", "identification"]],
        ["3. Possíveis causas", ["diagnosis"]],
        ["4. Ferramentas necessárias", ["tools"]],
        ["5. Sequência de testes", ["tests"]],
        ["6. Interpretação dos resultados", ["interpretation", "decision"]],
        ["7. Critérios de confirmação", ["confirmation"]],
        ["8. Possíveis reparos", ["repair"]],
      ];
  return (
    <section className="auto-answer auto-diagnostic">
      <h3>
        {codes
          ? "Consulta de códigos DTC"
          : "Diagnóstico orientado por evidências"}
      </h3>
      {codes ? (
        <>
          <p>
            {dtcs.length
              ? dtcs.join(" · ")
              : "Informe um código DTC na pesquisa."}
          </p>
          {dtcs.map((code) => (
            <p key={code}>
              {code.toUpperCase()} ·{" "}
              {/^P[02]/i.test(code)
                ? "estrutura padronizada de propulsão"
                : /^P1/i.test(code)
                  ? "faixa específica de fabricante"
                  : "a definição depende da norma e da montadora"}
              . Sistema:{" "}
              {
                (
                  {
                    P: "propulsão",
                    B: "carroceria",
                    C: "chassi",
                    U: "comunicação",
                  } as Record<string, string>
                )[code[0].toUpperCase()]
              }
              . Essa classificação geral não substitui a definição da fonte.
            </p>
          ))}
        </>
      ) : (
        <article>
          <h4>1. Sintoma informado</h4>
          <p>{data.query.q}</p>
        </article>
      )}
      <p>
        O sintoma ou DTC não confirma uma peça defeituosa. A substituição
        depende de testes e da documentação do veículo; valores de tensão não
        são universais.
      </p>
      {!data.answer && (
        <p>
          {data.ai === "not_configured"
            ? "A síntese por IA não está habilitada. Consulte os documentos originais."
            : "Não há síntese externa suficiente para preencher o procedimento."}
        </p>
      )}
      {sections.map(([label, categories]) => (
        <article key={String(label)}>
          <h4>{label}</h4>
          {render(categories as string[])}
        </article>
      ))}
      <article>
        <h4>{codes ? "Referências técnicas" : "9. Referências técnicas"}</h4>
        {data.sources.filter((s) => s.kind !== "video").length ? (
          <ul>
            {data.sources
              .filter((s) => s.kind !== "video")
              .map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title} · {s.host} ↗
                  </a>
                </li>
              ))}
          </ul>
        ) : (
          <p>Nenhuma referência externa retornou para esta consulta.</p>
        )}
      </article>
      {render(["safety", "divergence"])}
    </section>
  );
}
