import {
  SHARED_FILES,
  basePackageJson,
  baseGlobalsCss,
  baseLayout,
  readme,
} from "./shared";
import type { TemplateModule } from "./types";

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
}

const meta = {
  id: "blog",
  name: "Blog",
  description: "Blog index + per-post pages with markdown rendering.",
  tags: ["blog", "writing", "content", "publish"],
  estimated_build_time_seconds: 60,
  customization_schema: {
    business_name: { type: "string" as const, required: true },
    blog_title: { type: "string" as const, required: true },
    blog_subtitle: { type: "string" as const, required: true },
    posts: {
      type: "array" as const,
      required: true,
      min_items: 1,
      max_items: 10,
    },
    primary_color: {
      type: "string" as const,
      format: "hex" as const,
      default: "#FF8A3D",
    },
  },
  marketing_handoff: ["blog_title", "blog_subtitle", "posts"],
};

export const blogTemplate: TemplateModule = {
  meta,
  generateFiles: (config) => {
    const businessName = String(config.business_name ?? "Your Business");
    const blogTitle = String(config.blog_title ?? `${businessName} Blog`);
    const blogSubtitle = String(
      config.blog_subtitle ?? "Notes from the team.",
    );
    const posts = (Array.isArray(config.posts)
      ? config.posts
      : [
          {
            slug: "hello-world",
            title: "Hello, world.",
            excerpt: "We're starting something new.",
            body:
              "Welcome to our blog. We'll write here about what we're building and what we're learning.",
            date: new Date().toISOString().slice(0, 10),
          },
        ]) as Post[];
    const primary = String(config.primary_color ?? "#FF8A3D");
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const postsJson = JSON.stringify(posts, null, 2);

    return {
      ...SHARED_FILES,
      "package.json": basePackageJson(slug ? `${slug}-blog` : "blog"),
      "src/app/globals.css": baseGlobalsCss(primary),
      "src/app/layout.tsx": baseLayout(blogTitle),
      "src/data/posts.ts": `export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
}

export const POSTS: Post[] = ${postsJson};

export function postBySlug(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
`,
      "src/app/page.tsx": `import Link from "next/link";
import { POSTS } from "@/data/posts";

export default function Page() {
  const sorted = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <main className="px-6 py-16 max-w-3xl mx-auto">
      <header className="mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-fg-muted)] mb-3">
          ${businessName.replace(/`/g, "'")}
        </p>
        <h1 className="serif text-4xl md:text-5xl">${blogTitle.replace(/`/g, "'")}</h1>
        <p className="mt-3 text-[var(--color-fg-muted)]">${blogSubtitle.replace(/`/g, "'")}</p>
      </header>
      <div className="space-y-8">
        {sorted.map((p) => (
          <article key={p.slug} className="hairline rounded-2xl p-6">
            <div className="text-xs text-[var(--color-fg-muted)] mb-1">{p.date}</div>
            <h2 className="serif text-2xl mb-2">
              <Link href={\`/posts/\${p.slug}\`}>{p.title}</Link>
            </h2>
            <p className="text-[var(--color-fg-muted)]">{p.excerpt}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
`,
      "src/app/posts/[slug]/page.tsx": `import Link from "next/link";
import { POSTS, postBySlug } from "@/data/posts";

export async function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) {
    return (
      <main className="px-6 py-16 max-w-3xl mx-auto">
        <p>Not found.</p>
        <Link href="/" className="underline">← back</Link>
      </main>
    );
  }
  return (
    <main className="px-6 py-16 max-w-3xl mx-auto">
      <Link href="/" className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
        ← back
      </Link>
      <article className="mt-6">
        <div className="text-xs text-[var(--color-fg-muted)] mb-2">{post.date}</div>
        <h1 className="serif text-4xl md:text-5xl mb-6">{post.title}</h1>
        <div className="whitespace-pre-wrap leading-relaxed text-[var(--color-fg)]">
          {post.body}
        </div>
      </article>
    </main>
  );
}
`,
      "README.md": readme(`${businessName} Blog`, businessName),
    };
  },
};
