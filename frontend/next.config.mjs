/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors must fail the build. The codebase typechecks clean as of Phase 0;
  // silently shipping type errors is how a "working" demo breaks on stage.
  typescript: {
    ignoreBuildErrors: false,
  },
  // Next 16 writes AGENTS.md / CLAUDE.md into the frontend on dev start;
  // this repo does not want those generated files tracked.
  agentRules: false,

  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  },
}

export default nextConfig
