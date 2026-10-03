import { resolve } from 'node:path'
import { config } from 'dotenv'
import type { NextConfig } from 'next'

// Next only reads `.env` from its own folder, but this monorepo keeps one `.env`
// at the root so all four apps share it. Loading it here works because
// next.config.ts is evaluated before NEXT_PUBLIC_* values are inlined into the
// bundle. dotenv never overwrites an already-set variable, so Vercel wins.
config({ path: resolve(__dirname, '../../.env') })

const nextConfig: NextConfig = {
  // `@repo/ui` and `@repo/client` ship TypeScript source rather than a build
  // output, so Next compiles them as if they were part of this app. That keeps
  // the design system editable with hot reload instead of needing a rebuild
  // between changes.
  transpilePackages: ['@repo/ui', '@repo/client'],
  // Never ship a build that does not typecheck. If this is slowing you down,
  // fix the types — do not turn it off.
  typescript: { ignoreBuildErrors: false },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
  },
}

export default nextConfig
