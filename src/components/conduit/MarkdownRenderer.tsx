"use client";

import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "hr" };

function parseBlocks(md: string): Block[] {
  const lines = md.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      continue;
    }

    // Headings
    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      blocks.push({
        type: "heading",
        level: hMatch[1].length as 1 | 2 | 3,
        text: hMatch[2],
      });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim()) && line.trim().length >= 3) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+] /, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-block lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !/^[-*+] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", text: paraLines.join("\n") });
    }
  }

  return blocks;
}

// Inline: **bold**, *italic*, `code`, [link](url)
function parseInline(text: string, baseKey: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let remaining = text;
  let idx = 0;

  type InlinePattern = {
    re: RegExp;
    render: (m: RegExpMatchArray, key: string) => React.ReactNode;
  };

  const patterns: InlinePattern[] = [
    {
      re: /^`([^`]+)`/,
      render: (m, k) => (
        <code
          key={k}
          style={{
            background: "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-raised) 88%)",
            borderRadius: "4px",
            padding: "1px 5px",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.875em",
            color: "var(--color-accent)",
          }}
        >
          {m[1]}
        </code>
      ),
    },
    {
      re: /^\*\*([^*]+)\*\*/,
      render: (m, k) => (
        <strong key={k} style={{ fontWeight: 600 }}>
          {m[1]}
        </strong>
      ),
    },
    {
      re: /^__([^_]+)__/,
      render: (m, k) => (
        <strong key={k} style={{ fontWeight: 600 }}>
          {m[1]}
        </strong>
      ),
    },
    {
      re: /^\*([^*\n]+)\*/,
      render: (m, k) => <em key={k}>{m[1]}</em>,
    },
    {
      re: /^_([^_\n]+)_/,
      render: (m, k) => <em key={k}>{m[1]}</em>,
    },
    {
      re: /^\[([^\]]+)\]\(([^)]+)\)/,
      render: (m, k) => {
        const href = /^https?:\/\//.test(m[2]) ? m[2] : "#";
        return (
          <a
            key={k}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-accent)", textDecoration: "underline" }}
          >
            {m[1]}
          </a>
        );
      },
    },
  ];

  while (remaining.length > 0) {
    let matched = false;
    for (const { re, render } of patterns) {
      const m = remaining.match(re);
      if (m) {
        result.push(render(m, `${baseKey}-i${idx++}`));
        remaining = remaining.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Advance to next potential formatting start
      let end = 1;
      while (
        end < remaining.length &&
        remaining[end] !== "*" &&
        remaining[end] !== "`" &&
        remaining[end] !== "[" &&
        remaining[end] !== "_"
      ) {
        end++;
      }
      result.push(remaining.slice(0, end));
      remaining = remaining.slice(end);
    }
  }

  return result;
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div
      style={{
        margin: "10px 0",
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid var(--color-border)",
        fontSize: "13px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "5px 12px",
          background: "var(--color-surface-raised)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: copied ? "#22c55e" : "var(--color-text-muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: "4px",
            transition: "color 0.15s",
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "12px 16px",
          overflowX: "auto",
          background: "var(--color-surface-raised)",
          color: "var(--color-text)",
          fontFamily: "var(--font-mono, monospace)",
          lineHeight: 1.6,
          fontSize: "13px",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({
  content,
  baseKey = "md",
}: {
  content: string;
  baseKey?: string;
}) {
  const blocks = parseBlocks(content);

  return (
    <div>
      {blocks.map((block, bi) => {
        const k = `${baseKey}-b${bi}`;
        switch (block.type) {
          case "heading": {
            const sizes: Record<1 | 2 | 3, string> = {
              1: "18px",
              2: "16px",
              3: "14px",
            };
            const Tag = `h${block.level}` as "h1" | "h2" | "h3";
            return (
              <Tag
                key={k}
                style={{
                  fontWeight: 600,
                  fontSize: sizes[block.level],
                  margin: bi === 0 ? "0 0 6px" : "14px 0 6px",
                  lineHeight: 1.3,
                  color: "var(--color-text)",
                }}
              >
                {parseInline(block.text, k)}
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p
                key={k}
                style={{ margin: bi === 0 ? "0 0 6px" : "6px 0", lineHeight: 1.65 }}
              >
                {parseInline(block.text, k)}
              </p>
            );
          case "code":
            return <CodeBlock key={k} lang={block.lang} code={block.code} />;
          case "ul":
            return (
              <ul
                key={k}
                style={{
                  margin: "6px 0",
                  paddingLeft: "18px",
                  lineHeight: 1.65,
                  listStyleType: "disc",
                }}
              >
                {block.items.map((item, ii) => (
                  <li key={`${k}-li${ii}`}>{parseInline(item, `${k}-li${ii}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol
                key={k}
                style={{
                  margin: "6px 0",
                  paddingLeft: "18px",
                  lineHeight: 1.65,
                  listStyleType: "decimal",
                }}
              >
                {block.items.map((item, ii) => (
                  <li key={`${k}-li${ii}`}>{parseInline(item, `${k}-li${ii}`)}</li>
                ))}
              </ol>
            );
          case "hr":
            return (
              <hr
                key={k}
                style={{
                  border: "none",
                  borderTop: "1px solid var(--color-border)",
                  margin: "14px 0",
                }}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
