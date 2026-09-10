import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/**
 * Gedeelde pagina-achtergrond: de cursor-volgende glow (alleen op desktop met
 * een fijne muisaanwijzer), het grid, de ruis en twee langzaam bewegende orbs.
 *
 * De glow start onzichtbaar en op het midden van het scherm, en komt pas
 * sácht op zodra de pagina is ingeladen. Zo zie je bij een paginawissel nooit
 * meer een "flits" van linksboven naar de muis.
 */
export function PageBackground() {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const currentRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const finePointer =
        typeof window !== "undefined" &&
        window.matchMedia("(pointer: fine)").matches;
      setEnabled(finePointer && window.innerWidth >= 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    currentRef.current = { x: cx, y: cy };
    targetRef.current = { x: cx, y: cy };

    const fadeTimer = window.setTimeout(() => setVisible(true), 120);

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const tick = () => {
      const current = currentRef.current;
      const target = targetRef.current;

      current.x += (target.x - current.x) * 0.09;
      current.y += (target.y - current.y) * 0.09;

      if (overlayRef.current) {
        overlayRef.current.style.setProperty("--mx", `${current.x}px`);
        overlayRef.current.style.setProperty("--my", `${current.y}px`);
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handleMouseMove);
    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.clearTimeout(fadeTimer);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      setVisible(false);
    };
  }, [enabled]);

  return (
    <>
      {enabled && (
        <div
          ref={overlayRef}
          className="pointer-events-none fixed inset-0 z-0 hidden lg:block"
          style={
            {
              "--mx": "50vw",
              "--my": "50vh",
              opacity: visible ? 1 : 0,
              transition: "opacity 0.9s ease",
            } as CSSProperties
          }
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 opacity-90 dark:opacity-100"
            style={{
              background: `
                radial-gradient(480px circle at var(--mx) var(--my), rgba(255,138,31,0.13), transparent 38%),
                radial-gradient(220px circle at var(--mx) var(--my), rgba(255,193,94,0.11), transparent 28%)
              `,
              filter: "blur(10px)",
            }}
          />
          <div
            className="absolute inset-[-12%] opacity-40 mix-blend-soft-light dark:mix-blend-screen"
            style={{
              animation: "grainShift 10s steps(8) infinite",
              background: `
                radial-gradient(circle at var(--mx) var(--my), rgba(255,170,80,0.14), transparent 18%),
                repeating-linear-gradient(
                  0deg,
                  rgba(255,255,255,0.03) 0px,
                  rgba(255,255,255,0.03) 1px,
                  transparent 1px,
                  transparent 3px
                ),
                repeating-linear-gradient(
                  90deg,
                  rgba(255,138,31,0.03) 0px,
                  rgba(255,138,31,0.03) 1px,
                  transparent 1px,
                  transparent 4px
                )
              `,
            }}
          />
        </div>
      )}

      <div className="absolute inset-0 z-0">
        <div className="hero-grid absolute inset-0" />
        <div className="noise absolute inset-0 opacity-50 dark:opacity-25" />
        <div
          className="absolute left-1/2 top-[-12rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,138,31,0.18) 0%, rgba(255,138,31,0.07) 38%, transparent 72%)",
            animation: "drift 14s ease-in-out infinite",
          }}
        />
        <div
          className="absolute right-[-8rem] top-[20rem] h-[22rem] w-[22rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,177,74,0.11) 0%, rgba(255,177,74,0.04) 42%, transparent 72%)",
            animation: "drift 18s ease-in-out infinite reverse",
          }}
        />
      </div>
    </>
  );
}
