/** Logo en texto: "closet sale" + "LIAV" entre dos líneas rose gold. */
export function Logo({ tamano = "md" }: { tamano?: "sm" | "md" | "lg" }) {
  const titulo = { sm: "text-2xl", md: "text-3xl", lg: "text-5xl sm:text-6xl" }[tamano];
  const sub = { sm: "text-[0.55rem]", md: "text-[0.6rem]", lg: "text-xs" }[tamano];
  return (
    <span className="inline-flex flex-col items-center leading-none text-cacao">
      <span className={`font-display italic font-medium ${titulo}`}>closet sale</span>
      <span className="mt-1 flex w-full items-center gap-2">
        <span className="linea-rosegold flex-1" aria-hidden />
        <span className={`font-sans font-medium tracking-[0.5em] pl-[0.5em] ${sub}`}>LIAV</span>
        <span className="linea-rosegold flex-1" aria-hidden />
      </span>
    </span>
  );
}

/** Monograma "cs" en círculo. */
export function Monograma({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="closet sale">
      <circle cx="32" cy="32" r="30" fill="#F4D9D6" stroke="#B7826F" strokeWidth="1.5" />
      <text
        x="32"
        y="41"
        textAnchor="middle"
        fontFamily="Cormorant Garamond, Georgia, serif"
        fontStyle="italic"
        fontWeight="500"
        fontSize="30"
        fill="#3B2A26"
      >
        cs
      </text>
    </svg>
  );
}
