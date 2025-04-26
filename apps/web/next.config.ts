import type { NextConfig } from 'next';
import { loadEnvConfig } from '@next/env';

/* -------------------------------------------------
 * 1️⃣  让 `next dev` / `next build` 先加载根目录 .env*
 *     - .env.local         最高优先级（个人机密）
 *     - .env.development   仅 dev 环境
 *     - .env               默认 / 生产
 * ------------------------------------------------- */
loadEnvConfig(process.cwd());   // 这行必须写在最顶端

/* -------------------------------------------------
 * 2️⃣  若需要把「无 NEXT_PUBLIC_ 前缀」的变量
 *     传到 **Server Component / RSC action**，
 *     写在 env 字段即可（客户端 bundle 拿不到）
 * ------------------------------------------------- */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  env: {
    /** 例如：后端 API 内网地址，只给 Server 端用 */
    API_INTERNAL: process.env.API_INTERNAL || 'http://127.0.0.1:8000',
  },

  /* -------------------------------------------------
   * 3️⃣  开发阶段想复用后端端口，可加 rewrites
   * ------------------------------------------------- */
   async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
      {
        // ⚠️ 改成 http:// 并带上 /ws 前缀
        source: '/ws/:path*',
        destination: 'http://127.0.0.1:8000/ws/:path*',
      },
    ];
  },
};

export default nextConfig;
