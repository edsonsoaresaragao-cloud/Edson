"use client";
export function ModelZoomControls({
  disabled,
  onZoom,
}: {
  disabled: boolean;
  onZoom: (factor: number) => void;
}) {
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label="Aproximar modelo 3D"
        onClick={() => onZoom(1.22)}
      >
        ＋ Aproximar
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-label="Afastar modelo 3D"
        onClick={() => onZoom(1 / 1.22)}
      >
        − Afastar
      </button>
    </>
  );
}
