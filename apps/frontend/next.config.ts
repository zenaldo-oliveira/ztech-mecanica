import type { NextConfig } from "next";

/**
 * Endereço interno do backend (Fastify). O navegador nunca fala com ele diretamente:
 * todas as chamadas vão para /api/* na MESMA origem do frontend e o Next as repassa.
 * Assim o cookie de sessão (HttpOnly, SameSite=Lax) nunca cruza domínios e não há CORS
 * no navegador.
 */
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3333";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // beforeFiles: /api/* nunca cai em rotas dinâmicas do app (ex.: [...slug]).
      beforeFiles: [{ source: "/api/:path*", destination: `${API_INTERNAL_URL}/api/:path*` }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
