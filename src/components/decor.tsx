import { useAnnouncement } from "@/lib/announcer";

/**
 * Fondo de mercado: papel con manchas de hoja, cítrico y sol que se mueven
 * muy despacio. Es `position: fixed` y `pointer-events: none`, así que nada
 * de lo que ocurra aquí toca gestos ni scroll.
 */
export function MarketBackdrop() {
  return (
    <div className="market-backdrop" aria-hidden="true">
      <span className="market-backdrop__blob market-backdrop__blob--leaf float-slow" />
      <span
        className="market-backdrop__blob market-backdrop__blob--citrus float-slow"
        style={{ animationDelay: "-9s", animationDuration: "34s" }}
      />
      <span className="market-backdrop__grain" />
    </div>
  );
}

/** Región viva única de la app: todo lo anunciado entra por aquí. */
export function LiveRegion() {
  const { message, key } = useAnnouncement();
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      <span key={key}>{message}</span>
    </div>
  );
}

export function Sprig({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <path
        d="M16 27c0-8 0-13 0-19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16 12c-2.6-3.4-6.2-4.3-9.6-3 .5 3.6 3 6.2 6.4 6.6 1.2.2 2.3 0 3.2-.4Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M16 9c2.4-3.7 6.2-4.6 9.8-3.2-.6 3.8-3.2 6.3-6.8 6.6-1.2.1-2.2-.1-3-.5Z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}

/** Sol, nube o calor extremo: el clima también se ve, no solo se lee. */
export function WeatherGlyph({
  hot,
  veryHot,
  className = "size-12",
}: {
  hot: boolean;
  veryHot: boolean;
  className?: string;
}) {
  const ray = veryHot ? 4.5 : 3.4;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <circle cx="24" cy="24" r="9.5" fill="currentColor" opacity="0.92" />
      <circle cx="24" cy="24" r={ray + 8} stroke="currentColor" strokeWidth="1" opacity="0.35" />
      {Array.from({ length: 8 }).map((_, index) => {
        const angle = (index * Math.PI * 2) / 8 + 0.2;
        const inner = 12.4;
        const outer = veryHot ? 20 : 17.4;
        return (
          <line
            key={index}
            x1={24 + Math.cos(angle) * inner}
            y1={24 + Math.sin(angle) * inner}
            x2={24 + Math.cos(angle) * outer}
            y2={24 + Math.sin(angle) * outer}
            stroke="currentColor"
            strokeWidth={veryHot ? 2.1 : 1.7}
            strokeLinecap="round"
            opacity="0.75"
          />
        );
      })}
      {!hot ? (
        <path
          d="M6 36c2.4 0 3.2-1.6 5.6-1.6S14.8 36 17.2 36"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.5"
        />
      ) : null}
    </svg>
  );
}

/** Plato vacío dibujado a mano: el estado vacío también tiene carácter. */
export function EmptyPlate({ className = "size-40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" fill="none">
      <ellipse cx="100" cy="122" rx="66" ry="40" fill="currentColor" opacity="0.08" />
      <ellipse
        cx="100"
        cy="118"
        rx="62"
        ry="36"
        stroke="currentColor"
        strokeWidth="2.4"
        opacity="0.5"
      />
      <ellipse
        cx="100"
        cy="118"
        rx="46"
        ry="26"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.32"
        strokeDasharray="5 6"
      />
      <path d="M100 96c-4-14-14-20-27-19 1 12 9 19 21 21" fill="currentColor" opacity="0.35" />
      <path
        d="M100 96c3.4-15 13-22 27-21-1.2 13-9.4 20-21.6 22"
        fill="currentColor"
        opacity="0.5"
      />
      <path
        d="M100 98c0-8 .4-14 1-20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M152 58c0 0 3.4 3.2 3.4 6.2 0 2.4-1.8 4-4 4s-4-1.6-4-4c0-3 4.6-6.2 4.6-6.2Z"
        fill="currentColor"
        opacity="0.3"
      />
      <circle cx="52" cy="56" r="3.4" fill="currentColor" opacity="0.28" />
      <circle cx="168" cy="120" r="2.6" fill="currentColor" opacity="0.22" />
    </svg>
  );
}

/** Cinta de nombres del mercado: pura decoración, con texto alterno oculto. */
export function ProduceMarquee({ labels }: { labels: string[] }) {
  const row = labels.slice(0, 14);
  return (
    <div className="marquee py-1 text-sm tracking-[0.2em] text-stone uppercase">
      <div className="marquee__track" aria-hidden="true">
        {[0, 1].map((copy) => (
          <span key={copy} className="flex items-center gap-6">
            {row.map((label, index) => (
              <span key={`${copy}-${label}-${index}`} className="flex items-center gap-6">
                {label}
                <Sprig className="size-4 text-leaf" />
              </span>
            ))}
          </span>
        ))}
      </div>
      <span className="sr-only">Incluye {row.slice(0, 6).join(", ")} y más fichas.</span>
    </div>
  );
}

/** Chispas discretas al guardar: se apagan solas y no estorban al tacto. */
export function SparkBurst({ count = 6 }: { count?: number }) {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => {
        const angle = (index / count) * Math.PI * 2;
        return (
          <span
            key={index}
            className="spark bg-citrus"
            style={
              {
                left: "50%",
                top: "50%",
                "--spark-x": `${Math.cos(angle) * 22}px`,
                "--spark-y": `${Math.sin(angle) * 22}px`,
                animationDelay: `${index * 18}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
