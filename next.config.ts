import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Raíz del proyecto (evita que Turbopack use otro package-lock.json en el home). */
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot,
    // Evita "Can't resolve 'tailwindcss'" cuando el workspace o ~/package.json
    // hacen que el resolver tome una carpeta padre sin node_modules.
    resolveAlias: {
      tailwindcss: path.join(turbopackRoot, 'node_modules/tailwindcss'),
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  serverExternalPackages: ['mongodb'],
  devIndicators: {
    position: 'bottom-right'
  },
  // Re-habilitar headers de CORS para evitar problemas de conexión de assets
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Desactivar temporalmente Turbopack si da problemas (opcional, pero Next 16 lo prioriza)
  // transpilePackages: ['mongodb'],
};

export default nextConfig;
