"use client";

import { useEffect, useRef, useState } from "react";

import { useMediaQuery } from "@/lib/use-media-query";

interface EngineVideoProps {
  src: string;
  poster?: string;
  className?: string;
  /** Exibido se o vídeo não puder ser carregado/reproduzido. */
  fallback: React.ReactNode;
}

/**
 * Vídeo de fundo em loop (sem áudio). Começa sozinho ao carregar a página; com
 * prefers-reduced-motion fica pausado no pôster/primeiro quadro. Se o arquivo
 * falhar, mostra o `fallback` (motor procedural em SVG).
 */
export function EngineVideo({ src, poster, className, fallback }: EngineVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [failed, setFailed] = useState(false);

  // O <video> vem no HTML do servidor e começa a carregar antes da hidratação: um erro
  // precoce (arquivo inválido) dispararia antes do onError do React. Verifica o estado
  // já existente e escuta erros futuros diretamente no elemento.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const fail = () => setFailed(true);
    if (video.error) queueMicrotask(fail);
    video.addEventListener("error", fail);
    return () => video.removeEventListener("error", fail);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
      return;
    }
    // O React não emite o atributo `muted` no HTML do servidor nem o aplica na hidratação;
    // sem ele o navegador bloqueia o autoplay. Força no elemento antes de reproduzir.
    video.muted = true;
    video.defaultMuted = true;
    video.play().catch(() => {
      // Autoplay bloqueado (ex.: modo de economia de dados): fica no pôster, sem erro.
    });
  }, [reducedMotion]);

  if (failed) return <>{fallback}</>;

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
      className={className}
    />
  );
}
