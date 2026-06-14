"use client";

import { useState, useCallback, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { Copy, Check } from "lucide-react";
import hljs from "highlight.js/lib/common";
import "./markdown.css";

// Allow hljs className spans to pass through sanitize
const SANITIZE_SCHEMA = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), "className"],
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    pre: [...(defaultSchema.attributes?.pre ?? []), "className"],
  },
};

function ChatCodeBlock({ className, children }: { className?: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace(/^language-/, "") ?? "";
  const raw = String(children).replace(/\n$/, "");

  const highlighted =
    lang && hljs.getLanguage(lang)
      ? hljs.highlight(raw, { language: lang }).value
      : hljs.highlightAuto(raw).value;

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable (non-secure context)
    }
  }, [raw]);

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <div className="flex items-center justify-between border-b border-white/8 px-3.5 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {lang || "text"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre
        className="hljs overflow-x-auto p-4 text-[13px] leading-[1.7]"
        style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", margin: 0, background: "transparent" }}
      >
        {/* dangerouslySetInnerHTML is safe here: content is the output of hljs.highlight()
            which only emits <span class="hljs-*"> — no script/event attributes possible */}
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

const COMPONENTS: Components = {
  // Pass-through pre so the code component handles its own container
  pre({ children }) {
    return <>{children}</>;
  },

  code({ className, children, ...rest }) {
    // Fenced code blocks have a language- className; inline code does not
    if (className?.startsWith("language-")) {
      return <ChatCodeBlock className={className}>{children}</ChatCodeBlock>;
    }
    return (
      <code
        className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.875em]"
        style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)" }}
        {...rest}
      >
        {children}
      </code>
    );
  },

  a({ href, children, ...rest }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  },
};

interface Props {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className = "" }: Props) {
  return (
    <div className={`md-content text-[15px] leading-relaxed text-foreground/90 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, SANITIZE_SCHEMA]]}
        components={COMPONENTS}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
