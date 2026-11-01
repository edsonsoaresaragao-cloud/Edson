import {
  Settings,
  Cylinder,
  Zap,
  Gauge,
  Fuel,
  Link2,
  Droplets,
  Droplet,
} from "lucide-react";
import { type Engine } from "@/lib/engines";
import { getEngineSpecs, specLabels } from "@/lib/engine-specs";
const icons = [Settings, Cylinder, Zap, Gauge, Fuel, Link2, Droplets, Droplet];
export function EngineSpecificationPanel({ engine }: { engine: Engine }) {
  const specs = getEngineSpecs(engine);
  return (
    <section className="sheet-panel sheet-specs sheet-technical-specs">
      <h4>Especificações (referência {engine.family})</h4>
      <p className="sheet-spec-application">{specs.application}</p>
      <dl>
        {Object.entries(specs.fields).map(([key, field], i) => {
          const Icon = icons[i];
          return (
            <div
              className={`sheet-spec-row sheet-spec-${field.status}`}
              key={key}
            >
              <dt>
                <Icon size={16} aria-hidden="true" />
                {specLabels[key as keyof typeof specLabels]}
              </dt>
              <dd>
                {field.status === "pending" ? (
                  <span className="sheet-spec-pending">A confirmar</span>
                ) : (
                  field.value
                )}
                {field.status === "general" && (
                  <span
                    className="sheet-spec-general"
                    title="Característica geral da referência visual; confirmar na versão"
                  >
                    {" "}
                    *
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="sheet-panel-note">
        * Característica geral, sem especificar tipo de bomba, pressão, óleo ou
        trocador. Valores confirmados valem apenas para a aplicação acima, não
        certificam a versão da imagem. “A confirmar” indica dado ainda não
        documentado.
      </p>
      {specs.sources.map((s) => (
        <a
          className="sheet-technical-source"
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Fonte técnica: {s.title} ↗
        </a>
      ))}
    </section>
  );
}
