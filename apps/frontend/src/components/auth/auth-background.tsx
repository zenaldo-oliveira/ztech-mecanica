import { existsSync } from "node:fs";
import path from "node:path";

import { EngineSchematic } from "@/components/auth/engine-schematic";
import { EngineVideo } from "@/components/auth/engine-video";

// Fundo cinematográfico das telas de autenticação (decorativo, aria-hidden).
//
// Mídia: /public/videos/engine.mp4 (loop curto, H.264) com pôster engine-poster.jpg.
// Enquanto o arquivo não existir — ou se falhar ao carregar — usa o motor procedural
// em SVG (EngineSchematic), com a mesma cinemática virabrequim → bielas → pistões.
//
// Tratamento por cima da mídia: filtro (brilho/contraste/saturação), preto translúcido,
// gradiente azul profundo, vinheta e grade técnica discreta.

const VIDEO_SRC = "/videos/engine.mp4";
const POSTER_SRC = "/videos/engine-poster.jpg";

function publicFileExists(publicPath: string): boolean {
  return existsSync(path.join(process.cwd(), "public", publicPath));
}

/** Vídeo: cobre 100% da viewport sem barras; enquadramento ajustado no celular. */
const VIDEO_CLASS =
  "absolute inset-0 size-full object-cover object-center [filter:brightness(0.55)_contrast(1.08)_saturate(0.85)] max-sm:object-[60%_center]";
/** Motor procedural (SVG com preserveAspectRatio slice): já é escuro, filtro mais leve. */
const SCHEMATIC_CLASS = "auth-fade-in absolute inset-0 size-full [filter:brightness(0.8)_saturate(0.9)]";

export function AuthBackground() {
  const hasVideo = publicFileExists(VIDEO_SRC);
  const poster = publicFileExists(POSTER_SRC) ? POSTER_SRC : undefined;
  const schematic = <EngineSchematic className={SCHEMATIC_CLASS} />;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-[#05070b]">
      {hasVideo ? <EngineVideo src={VIDEO_SRC} poster={poster} className={VIDEO_CLASS} fallback={schematic} /> : schematic}

      {/* Escurecimento base: o formulário é o elemento principal */}
      <div className="absolute inset-0 bg-black/55" />
      {/* Gradiente azul profundo, mais denso no centro onde fica o cartão */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_50%,color-mix(in_oklab,var(--sidebar)_70%,transparent),transparent_75%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_oklab,var(--sidebar-primary)_14%,transparent)] via-transparent to-[color-mix(in_oklab,var(--sidebar)_85%,transparent)]" />
      {/* Iluminação azul discreta vinda de cima (reflexo no metal) */}
      <div className="auth-glow absolute -top-64 left-1/2 size-[46rem] -translate-x-1/2 rounded-full bg-sidebar-primary/12 blur-3xl" />
      {/* Grade técnica discreta */}
      <div className="auth-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_70%_65%_at_50%_50%,black_20%,transparent_80%)]" />
      {/* Vinheta nas bordas */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_80%_at_50%_50%,transparent_45%,rgb(0_0_0/0.85)_100%)]" />
    </div>
  );
}
