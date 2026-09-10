import { useEffect, useLayoutEffect, useRef, useState } from "react";

type HeroCycleProps = {
  lines: string[];
  intervalMs?: number;
  transitionMs?: number;
};

/**
 * Roteert een reeks hero-zinnen met een zachte fade + verschuiving.
 * `intervalMs` bepaalt hoe lang elke zin blijft staan, `transitionMs` hoe snel
 * de overgang van zin A naar zin B verloopt. Beide zijn via de admin aanpasbaar.
 *
 * De containerhoogte meet per regel en animeert mee, zodat de ondertitel altijd
 * strak aansluit — ook wanneer een tekst 1 regel is en de volgende 2 regels.
 *
 * De rotatie (en dus het wisselen van hoogte) draait alleen wanneer de tekst in
 * beeld is. Zodra de bezoeker voorbij de hero scrolt, pauzeert het geheel, zodat
 * de elementen eronder niet meer mee verschuiven. Respecteert `prefers-reduced-motion`.
 */
export function HeroCycle({
  lines,
  intervalMs = 3800,
  transitionMs = 500,
}: HeroCycleProps) {
  const [index, setIndex] = useState(0);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [inView, setInView] = useState(true);
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const interval = Math.max(1000, Number(intervalMs) || 3800);
  const duration = Math.max(150, Number(transitionMs) || 500);

  // Houd bij of de hero-tekst (deels) zichtbaar is.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Meet de hoogte van de actieve regel en pas de containerhoogte daarop aan.
  useLayoutEffect(() => {
    const measure = () => {
      const h = lineRefs.current[index]?.offsetHeight ?? 0;
      setHeight(h || undefined);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [lines, index]);

  // Roteer alleen wanneer er iets te roteren valt én de tekst in beeld is.
  useEffect(() => {
    if (lines.length <= 1 || !inView) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % lines.length),
      interval
    );
    return () => window.clearInterval(id);
  }, [lines.length, interval, inView]);

  if (lines.length === 0) return null;

  return (
    <span
      ref={containerRef}
      className="relative block"
      style={{ height: height ?? "auto", transition: `height ${duration}ms ease` }}
    >
      {lines.map((line, i) => {
        const active = i === index;
        return (
          <span
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            className={`absolute inset-x-0 top-0 block transition-opacity transition-transform ease-out ${
              active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
            style={{ transitionDuration: `${duration}ms` }}
            aria-hidden={!active}
          >
            {line}
          </span>
        );
      })}
    </span>
  );
}
