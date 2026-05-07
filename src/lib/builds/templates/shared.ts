// Files shared by every template (next config, tailwind config, gitignore, etc).
// Keeps individual template generators focused on their actual content.

export const SHARED_FILES: Record<string, string> = {
  "next.config.ts": `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* default config */
};

export default nextConfig;
`,
  "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`,
  "next-env.d.ts": `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`,
  ".gitignore": `node_modules
.next
out
.env*.local
.vercel
*.log
.DS_Store
`,
  "tailwind.config.ts": `import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
`,
  "postcss.config.mjs": `const config = {
  plugins: { "@tailwindcss/postcss": {} },
};
export default config;
`,
};

export function basePackageJson(name: string): string {
  return JSON.stringify(
    {
      name,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
      dependencies: {
        next: "^16.2.2",
        react: "^19.2.4",
        "react-dom": "^19.2.4",
      },
      devDependencies: {
        "@tailwindcss/postcss": "^4",
        "@types/node": "^20",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        tailwindcss: "^4",
        typescript: "^5",
      },
    },
    null,
    2,
  );
}

export function baseGlobalsCss(primaryColor: string): string {
  return `@import "tailwindcss";

@theme inline {
  --color-bg: #0A0908;
  --color-fg: #F5F1EA;
  --color-fg-muted: #8C8884;
  --color-border: #1F1C19;
  --color-accent: ${primaryColor};
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-serif: ui-serif, Georgia, serif;
}

html, body { background: var(--color-bg); color: var(--color-fg); font-family: var(--font-sans); }
body { -webkit-font-smoothing: antialiased; line-height: 1.6; }
::selection { background: ${primaryColor}33; color: var(--color-fg); }

.btn-primary {
  background: var(--color-accent);
  color: #0A0908;
  padding: 14px 28px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: opacity 200ms;
}
.btn-primary:hover { opacity: 0.9; }
.serif { font-family: var(--font-serif); letter-spacing: -0.02em; }
.hairline { border: 1px solid var(--color-border); }
`;
}

export function baseLayout(title: string): string {
  return `import "./globals.css";

export const metadata = {
  title: ${JSON.stringify(title)},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
}

export function readme(name: string, builtBy: string, liveHint?: string): string {
  return `# ${name}

Built by ${builtBy} with Conduit.

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

${liveHint ? `Live at: ${liveHint}\n` : ""}
`;
}
