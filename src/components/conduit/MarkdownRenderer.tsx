"use client";

import { memo, useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";

// ---------------------------------------------------------------------------
// Syntax highlighting — zero-dependency, token-based
// ---------------------------------------------------------------------------

type TokenKind = "keyword" | "string" | "comment" | "number" | "operator" | "plain";

interface Token {
  kind: TokenKind;
  text: string;
}

const KEYWORDS = new Set([
  "abstract","as","async","await","break","case","catch","class","const","continue",
  "debugger","declare","default","delete","do","else","enum","export","extends",
  "false","finally","for","from","function","get","if","implements","import","in",
  "instanceof","interface","let","module","namespace","new","null","of","override",
  "package","private","protected","public","readonly","require","return","set",
  "static","super","switch","this","throw","true","try","type","typeof","undefined",
  "var","void","while","with","yield",
  // Python
  "and","del","elif","except","exec","global","lambda","nonlocal","not","or","pass",
  "print","raise","with","yield",
  // Bash
  "echo","fi","then","done","do","esac","select","until","elif","function",
  // SQL
  "SELECT","FROM","WHERE","INSERT","UPDATE","DELETE","CREATE","DROP","TABLE",
  "JOIN","LEFT","RIGHT","INNER","OUTER","ON","AND","OR","NOT","NULL","INTO",
  "VALUES","SET","ORDER","BY","GROUP","HAVING","LIMIT","AS","DISTINCT","COUNT",
  "SUM","AVG","MAX","MIN",
]);

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Line comment: // or #
    if (
      (line[i] === "/" && line[i + 1] === "/") ||
      (line[i] === "#" && line[i + 1] !== "{")
    ) {
      tokens.push({ kind: "comment", text: line.slice(i) });
      break;
    }

    // String: single or double or backtick quoted
    if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
      const q = line[i];
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\" && j + 1 < line.length) { j += 2; continue; }
        if (line[j] === q) { j++; break; }
        j++;
      }
      tokens.push({ kind: "string", text: line.slice(i, j) });
      i = j;
      continue;
    }

    // Number
    if (/[0-9]/.test(line[i]) && (i === 0 || /[^a-zA-Z_$]/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[0-9._xXa-fA-FbBoO]/.test(line[j])) j++;
      tokens.push({ kind: "number", text: line.slice(i, j) });
      i = j;
      continue;
    }

    // Word — keyword or identifier
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      tokens.push({ kind: KEYWORDS.has(word) ? "keyword" : "plain", text: word });
      i = j;
      continue;
    }

    // Operator / punctuation — collect one character at a time
    tokens.push({ kind: "operator", text: line[i] });
    i++;
  }

  return tokens;
}

const TOKEN_COLOR: Record<TokenKind, string> = {
  keyword: "var(--color-dept-engineering, #60A5FA)",
  string: "var(--color-green, #34D399)",
  comment: "var(--color-text-muted, #8C8884)",
  number: "var(--color-amber, #FBBF24)",
  operator: "var(--color-text, #F5F1EA)",
  plain: "var(--color-text, #F5F1EA)",
};

function SyntaxLine({ line }: { line: string }) {
  const tokens = tokenizeLine(line);
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: TOKEN_COLOR[t.kind] }}>
          {t.text}
        </span>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Code block with language label + copy button
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied!" : "Copy code"}
      title={copied ? "Copied!" : "Copy code"}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-all"
      style={{
        color: copied ? "var(--color-green, #34D399)" : "var(--color-text-muted, #8C8884)",
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        if (!copied) (e.currentTarget as HTMLElement).style.color = "var(--color-text, #F5F1EA)";
      }}
      onMouseLeave={(e) => {
        if (!copied) (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted, #8C8884)";
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}

function HighlightedCodeBlock({ lang, code }: { lang: string; code: string }) {
  const lines = code.split("\n");
  // Remove trailing empty line that split often produces
  if (lines[lines.length - 1] === "") lines.pop();

  return (
    <div
      className="rounded-lg overflow-hidden my-3"
      style={{
        border: "1px solid var(--color-border, #1F1C19)",
        background: "var(--color-surface, #0A0908)",
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          borderBottom: "1px solid var(--color-border, #1F1C19)",
          background: "var(--color-surface-elevated, #14110F)",
        }}
      >
        <span
          className="text-[11px] uppercase tracking-[0.15em]"
          style={{ color: "var(--color-text-muted, #8C8884)" }}
        >
          {lang || "code"}
        </span>
        <CopyButton text={code} />
      </div>

      {/* Code */}
      <pre
        className="overflow-x-auto px-4 py-3 text-[13px] leading-[1.7]"
        style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", margin: 0 }}
      >
        <code>
          {lines.map((line, i) => (
            <span key={i} className="block">
              <SyntaxLine line={line} />
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline markdown parser
// ---------------------------------------------------------------------------

interface Segment {
  type: "text" | "bold" | "italic" | "code" | "link";
  content: string;
  href?: string;
}

function parseInline(text: string): Segment[] {
  const segments: Segment[] = [];
  let i = 0;
  let plain = "";

  const flush = () => {
    if (plain) { segments.push({ type: "text", content: plain }); plain = ""; }
  };

  while (i < text.length) {
    // Bold: **text** or __text__
    if (
      (text[i] === "*" && text[i + 1] === "*") ||
      (text[i] === "_" && text[i + 1] === "_")
    ) {
      const delim = text.slice(i, i + 2);
      const end = text.indexOf(delim, i + 2);
      if (end !== -1) {
        flush();
        segments.push({ type: "bold", content: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    // Italic: *text* or _text_
    if (text[i] === "*" || text[i] === "_") {
      const delim = text[i];
      const end = text.indexOf(delim, i + 1);
      if (end !== -1 && end > i + 1) {
        flush();
        segments.push({ type: "italic", content: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Inline code: `code`
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        flush();
        segments.push({ type: "code", content: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Link: [text](url)
    if (text[i] === "[") {
      const close = text.indexOf("]", i + 1);
      if (close !== -1 && text[close + 1] === "(") {
        const urlEnd = text.indexOf(")", close + 2);
        if (urlEnd !== -1) {
          const linkText = text.slice(i + 1, close);
          const href = text.slice(close + 2, urlEnd);
          flush();
          segments.push({ type: "link", content: linkText, href });
          i = urlEnd + 1;
          continue;
        }
      }
    }

    plain += text[i];
    i++;
  }
  flush();
  return segments;
}

function renderSegments(segments: Segment[], key: string) {
  return segments.map((seg, j) => {
    const k = `${key}-${j}`;
    if (seg.type === "bold") {
      return <strong key={k} style={{ color: "var(--color-text, #F5F1EA)", fontWeight: 600 }}>{seg.content}</strong>;
    }
    if (seg.type === "italic") {
      return <em key={k} style={{ color: "var(--color-text, #F5F1EA)" }}>{seg.content}</em>;
    }
    if (seg.type === "code") {
      return (
        <code
          key={k}
          className="px-1.5 py-0.5 rounded text-[0.85em]"
          style={{
            background: "var(--color-surface-elevated, #14110F)",
            border: "1px solid var(--color-border, #1F1C19)",
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            color: "var(--color-accent, #FF8A3D)",
          }}
        >
          {seg.content}
        </code>
      );
    }
    if (seg.type === "link") {
      // XSS: only allow http/https
      const safe = /^https?:\/\//i.test(seg.href ?? "");
      if (!safe) return <span key={k}>{seg.content}</span>;
      return (
        <a
          key={k}
          href={seg.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
          style={{ color: "var(--color-dept-engineering, #60A5FA)" }}
        >
          {seg.content}
        </a>
      );
    }
    return <span key={k}>{seg.content}</span>;
  });
}

// ---------------------------------------------------------------------------
// Block-level markdown parser
// ---------------------------------------------------------------------------

interface Block {
  type: "paragraph" | "heading" | "code" | "list" | "hr" | "table";
  level?: number;       // heading
  lang?: string;        // code fence
  content?: string;     // paragraph/heading
  items?: string[];     // list
  code?: string;        // code block
  ordered?: boolean;
  headers?: string[];   // table
  rows?: string[][];    // table
}

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fenceMatch = line.match(/^```(\w*)/);
    if (fenceMatch) {
      const lang = fenceMatch[1] || "";
      let j = i + 1;
      const codeLines: string[] = [];
      while (j < lines.length && !lines[j].startsWith("```")) {
        codeLines.push(lines[j]);
        j++;
      }
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      i = j + 1;
      continue;
    }

    // Horizontal rule
    if (/^(---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        content: headingMatch[2],
      });
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "list", items, ordered: false });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push({ type: "list", items, ordered: true });
      continue;
    }

    // GFM table: header row followed by separator row (| --- | ... |)
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^[\s|:\-]+$/.test(lines[i + 1]) &&
      lines[i + 1].includes("|") &&
      lines[i + 1].includes("-")
    ) {
      const splitCells = (l: string) =>
        l.trim().replace(/^\||\|$/g, "").split("|").map((s) => s.trim());
      const headers = splitCells(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(splitCells(lines[i]));
        i++;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    // Skip blank lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph: collect consecutive non-blank non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,4}\s/.test(lines[i]) &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^(---+|\*\*\*+|___+)\s*$/.test(lines[i]) &&
      !(lines[i].includes("|") && i + 1 < lines.length && /^[\s|:\-]+$/.test(lines[i + 1]) && lines[i + 1].includes("-"))
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", content: paraLines.join(" ") });
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  content: string;
  /** When true, render as plain pre-wrap text (streaming in progress). */
  streaming?: boolean;
  /** Accent color for the blinking caret. */
  caretColor?: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  streaming = false,
  caretColor,
}: Props) {
  if (streaming) {
    return (
      <span className="whitespace-pre-wrap leading-relaxed">
        {content}
        {caretColor && (
          <span
            aria-hidden
            className="inline-block w-[2px] h-4 -mb-1 ml-1 caret"
            style={{ background: caretColor }}
          />
        )}
      </span>
    );
  }

  const blocks = parseBlocks(content);

  return (
    <div className="markdown-body leading-relaxed space-y-2">
      {blocks.map((block, bi) => {
        if (block.type === "code") {
          return (
            <HighlightedCodeBlock
              key={bi}
              lang={block.lang ?? ""}
              code={block.code ?? ""}
            />
          );
        }

        if (block.type === "hr") {
          return (
            <hr
              key={bi}
              style={{ border: "none", borderTop: "1px solid var(--color-border, #1F1C19)", margin: "1rem 0" }}
            />
          );
        }

        if (block.type === "heading") {
          const segs = parseInline(block.content ?? "");
          const rendered = renderSegments(segs, `h${bi}`);
          const sz = block.level === 1
            ? "text-xl font-semibold mt-4 mb-1"
            : block.level === 2
            ? "text-lg font-semibold mt-3 mb-1"
            : "text-base font-semibold mt-2 mb-0.5";
          return (
            <p key={bi} className={sz} style={{ color: "var(--color-text, #F5F1EA)" }}>
              {rendered}
            </p>
          );
        }

        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag
              key={bi}
              className={block.ordered ? "list-decimal pl-5 space-y-1" : "list-disc pl-5 space-y-1"}
              style={{ color: "var(--color-text, #F5F1EA)" }}
            >
              {block.items!.map((item, li) => {
                const segs = parseInline(item);
                return (
                  <li key={li} className="text-sm leading-relaxed">
                    {renderSegments(segs, `li${bi}-${li}`)}
                  </li>
                );
              })}
            </Tag>
          );
        }

        if (block.type === "table") {
          return (
            <div key={bi} className="overflow-x-auto my-3">
              <table
                className="w-full text-sm border-collapse"
                style={{ borderColor: "var(--color-border, #1F1C19)" }}
              >
                <thead>
                  <tr>
                    {(block.headers ?? []).map((h, ci) => (
                      <th
                        key={ci}
                        className="px-4 py-2 text-left text-[11px] uppercase tracking-[0.12em] font-semibold"
                        style={{
                          background: "var(--color-surface-elevated, #14110F)",
                          borderBottom: "2px solid var(--color-border, #1F1C19)",
                          borderRight: ci < (block.headers ?? []).length - 1
                            ? "1px solid var(--color-border, #1F1C19)"
                            : "none",
                          color: "var(--color-text-muted, #8C8884)",
                        }}
                      >
                        {renderSegments(parseInline(h), `th${bi}-${ci}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(block.rows ?? []).map((row, ri) => (
                    <tr
                      key={ri}
                      style={{
                        background: ri % 2 === 0
                          ? "transparent"
                          : "color-mix(in srgb, var(--color-surface-elevated, #14110F) 50%, transparent)",
                      }}
                    >
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-4 py-2"
                          style={{
                            border: "1px solid var(--color-border, #1F1C19)",
                            color: "var(--color-text, #F5F1EA)",
                          }}
                        >
                          {renderSegments(parseInline(cell), `td${bi}-${ri}-${ci}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // paragraph
        const segs = parseInline(block.content ?? "");
        return (
          <p
            key={bi}
            className="text-sm leading-relaxed"
            style={{ color: "var(--color-text, #F5F1EA)" }}
          >
            {renderSegments(segs, `p${bi}`)}
          </p>
        );
      })}
    </div>
  );
});
