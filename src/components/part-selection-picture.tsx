"use client";
import type { ReactNode } from "react";

export function PartSelectionPicture({
  name,
  onSelect,
  children,
}: {
  name: string;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <div className="part-selection-picture">
      {children}
      <button
        type="button"
        aria-label={`Selecionar imagem: ${name}`}
        onClick={onSelect}
      />
    </div>
  );
}
