"use client";
import { useState } from "react";
import styles from "./library.module.css";

export function BudgetActivity({ page }: { page: number }) {
  const [component, setComponent] = useState("");
  const [decision, setDecision] = useState("Inspecionar antes de decidir");
  const [reason, setReason] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [labor, setLabor] = useState("");
  const [draft, setDraft] = useState("");
  const amount = (value: string) => {
    const number = Number(value.replace(",", "."));
    return Number.isFinite(number) && number >= 0 ? number : 0;
  };
  const money = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  const subtotal = amount(quantity) * amount(unitCost);
  const total = subtotal + amount(labor);
  return (
    <section
      className={`academy-note ${styles.budget}`}
      aria-label="Atividade de orçamento técnico"
    >
      <h3>Oficina · Elabore um orçamento técnico</h3>
      <p>
        Exercício da EDSON OFICINA, baseado no estudo desta página. Uma
        recomendação geral de troca não define uma obrigação para todos os
        motores. Justifique cada decisão pela aplicação e pela condição
        encontrada.
      </p>
      <label>
        Componente e aplicação
        <input
          value={component}
          onChange={(e) => setComponent(e.target.value)}
          placeholder="Identifique o componente e o motor"
        />
      </label>
      <label>
        Decisão proposta
        <select value={decision} onChange={(e) => setDecision(e.target.value)}>
          <option>Inspecionar antes de decidir</option>
          <option>Substituir conforme especificação e condição</option>
          <option>Manter após inspeção justificada</option>
        </select>
      </label>
      <label>
        Justificativa e referência da página
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Relacione a condição, a orientação da fonte e a verificação necessária"
        />
      </label>
      <label>
        Quantidade proposta
        <input
          type="number"
          min="0"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </label>
      <label>
        Preço unitário cotado por você (R$)
        <input
          type="number"
          min="0"
          step="0.01"
          value={unitCost}
          onChange={(e) => setUnitCost(e.target.value)}
          placeholder="A cotar"
        />
      </label>
      <label>
        Mão de obra cotada por você (R$)
        <input
          type="number"
          min="0"
          step="0.01"
          value={labor}
          onChange={(e) => setLabor(e.target.value)}
          placeholder="A cotar"
        />
      </label>
      <label>
        Fornecedor, data e observações da cotação
        <input
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="Registre a origem do preço; não é um valor sugerido pela aula"
        />
      </label>
      <p aria-live="polite">
        Subtotal das peças: {unitCost.trim() ? money(subtotal) : "a cotar"}.
        Total dos valores informados:{" "}
        {unitCost.trim() || labor.trim() ? money(total) : "a cotar"}. Valores
        não informados continuam a cotar. Todos os preços são estimativas
        inseridas por você.
      </p>
      <button
        type="button"
        className="button secondary"
        disabled={!component.trim() || !reason.trim()}
        onClick={() =>
          setDraft(
            `Exercício de orçamento — página ${page}\nComponente/aplicação: ${component}\nDecisão: ${decision}\nJustificativa: ${reason}\nQuantidade: ${quantity || "A definir"}\nPreço unitário: ${unitCost.trim() ? money(amount(unitCost)) : "A cotar"}\nSubtotal de peças: ${unitCost.trim() ? money(subtotal) : "A cotar"}\nMão de obra: ${labor.trim() ? money(amount(labor)) : "A cotar"}\nTotal dos valores informados: ${unitCost.trim() || labor.trim() ? money(total) : "A cotar"}\nCotação informada pelo aluno: ${cost || "A cotar"}`,
          )
        }
      >
        Organizar meu rascunho
      </button>
      {draft && (
        <div className={styles.budgetOutput} role="status">
          <p>{draft}</p>
          <p>
            Rascunho desta sessão. Copie seu texto antes de sair. Esta atividade
            não altera notas nem certifica um reparo.
          </p>
        </div>
      )}
    </section>
  );
}
