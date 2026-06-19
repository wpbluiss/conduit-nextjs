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

// Syntax colors use cx tokens — fallbacks are cx-spec values (not ember palette)
const TOKEN_COLOR: Record<TokenKind, string> = {
  keyword:  "var(--cx-accent-bright)",
  string:   "var(--cx-reward)",
  comment:  "var(--cx-text-faint)",
  number:   "var(--color-amber)",
  operator: "var(--cx-text-muted)",
  plain:    "var(--cx-text)",
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
// Streaming caret
// ---------------------------------------------------------------------------

function StreamingCaret({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block w-[2px] h-4 -mb-1 ml-0.5 caret"
      style={{ background: color }}
    />
  );
}

// ---------------------------------------------------------------------------
// Code block with language label + copy button (appears on hover)
// ---------------------------------------------------------------------------

function CopyButton({ text, alwaysVisible }: { text: string; alwaysVisible?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied!" : "Copy code"}
      title={copied ? "Copied!" : "Copy"}
      className={[
        "cx-icon-btn cx-focus-ring flex items-center justify-center w-8 h-8 rounded-lg",
        "transition-opacity",
        alwaysVisible || copied
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 focus:opacity-100",
      ].join(" ")}
      style={{
        transitionDuration: "var(--cx-dur-fast, 120ms)",
        transitionTimingFunction: "var(--cx-ease, cubic-bezier(0.22,1,0.36,1))",
        color: copied ? "var(--cx-reward)" : undefined,
      }}
    >
      {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
    </button>
  );
}

function HighlightedCodeBlock({
  lang,
  code,
  streaming = false,
  caretColor,
}: {
  lang: string;
  code: string;
  streaming?: boolean;
  caretColor?: string;
}) {
  const lines = code.split("\n");
  // Remove trailing empty line that split often produces
  if (lines[lines.length - 1] === "") lines.pop();

  return (
    <div
      className="rounded-xl overflow-hidden my-3 group"
      style={{
        background: "var(--cx-surface-raised)",
        border: "1px solid var(--cx-glass-border)",
        boxShadow: [
          "var(--cx-glass-shadow, 0 1px 3px rgba(0,0,0,.40), 0 4px 16px rgba(0,0,0,.30))",
          "var(--cx-glass-highlight, inset 0 1px 0 rgba(255,255,255,.10))",
        ].join(", "),
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4"
        style={{
          height: "36px",
          borderBottom: "1px solid var(--cx-glass-border)",
          background: "var(--cx-glass-bg)",
        }}
      >
        <span
          className="cx-mono cx-type-xs uppercase tracking-[0.15em]"
          style={{ color: "var(--cx-text-faint)" }}
        >
          {lang || "code"}
        </span>
        {/* Copy button: hidden during streaming (opacity 0, pointer-events off),
            fades in at 120ms when streaming ends */}
        <div
          style={{
            opacity: streaming ? 0 : 1,
            transition: streaming
              ? undefined
              : "opacity var(--cx-dur-fast, 120ms) var(--cx-ease, cubic-bezier(0.22,1,0.36,1))",
            pointerEvents: streaming ? "none" : undefined,
          }}
        >
          <CopyButton text={code} />
        </div>
      </div>

      {/* Code body */}
      <pre
        className="cx-code-scroll overflow-x-auto px-4 py-3 cx-type-sm leading-[1.7]"
        style={{ fontFamily: "var(--font-mono, monospace)", margin: 0 }}
      >
        <code>
          {lines.map((line, i) => {
            const isLastLine = i === lines.length - 1;
            return (
              <span key={i} className="block">
                <SyntaxLine line={line} />
                {/* Caret on the last partial line while streaming */}
                {streaming && isLastLine && caretColor && (
                  <StreamingCaret color={caretColor} />
                )}
              </span>
            );
          })}
          {/* Caret when code block is empty (just opened the fence) */}
          {streaming && lines.length === 0 && caretColor && (
            <StreamingCaret color={caretColor} />
          )}
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
      return (
        <strong key={k} style={{ color: "var(--cx-text)", fontWeight: 600 }}>
          {seg.content}
        </strong>
      );
    }
    if (seg.type === "italic") {
      return (
        <em key={k} style={{ color: "var(--cx-text)" }}>
          {seg.content}
        </em>
      );
    }
    if (seg.type === "code") {
      return (
        <code
          key={k}
          className="px-1.5 py-0.5 rounded-md text-[0.85em]"
          style={{
            background: "var(--cx-surface-raised)",
            border: "1px solid var(--cx-border)",
            fontFamily: "var(--font-mono, monospace)",
            color: "var(--cx-accent-bright)",
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
          className="underline underline-offset-2 transition-colors duration-150"
          style={{ color: "var(--cx-accent-bright)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--cx-accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "var(--cx-accent-bright)";
          }}
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
  type: "paragraph" | "heading" | "code" | "list" | "hr" | "table" | "blockquote";
  level?: number;       // heading
  lang?: string;        // code fence
  content?: string;     // paragraph/heading
  items?: string[];     // list or blockquote lines
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

    // Blockquote: lines starting with >
    if (/^>\s?/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        items.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", items });
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
      !/^>\s?/.test(lines[i]) &&
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
// Shared block-to-JSX renderer
// caretColor: if set, place a blinking caret at the end of this block
// ---------------------------------------------------------------------------

function renderBlock(block: Block, bi: number, caretColor?: string): React.ReactNode {
  if (block.type === "code") {
    return (
      <HighlightedCodeBlock
        key={bi}
        lang={block.lang ?? ""}
        code={block.code ?? ""}
        streaming={!!caretColor}
        caretColor={caretColor}
      />
    );
  }

  if (block.type === "hr") {
    return (
      <hr
        key={bi}
        style={{
          border: "none",
          borderTop: "1px solid var(--cx-border)",
          margin: "var(--cx-space-4, 16px) 0",
        }}
      />
    );
  }

  if (block.type === "heading") {
    const segs = parseInline(block.content ?? "");
    const rendered = renderSegments(segs, `h${bi}`);
    const [fontSize, margin] =
      block.level === 1
        ? ["var(--cx-type-lg, 20px)", "mt-5 mb-2"]
        : block.level === 2
        ? ["var(--cx-type-md, 16px)", "mt-4 mb-1"]
        : ["var(--cx-type-base, 14px)", "mt-3 mb-0.5"];
    return (
      <p
        key={bi}
        className={margin}
        style={{
          fontSize,
          fontWeight: 600,
          lineHeight: "var(--cx-lh-heading, 1.10)",
          letterSpacing: "var(--cx-ls-tight, -0.01em)",
          color: "var(--cx-text)",
        }}
      >
        {rendered}
        {caretColor && <StreamingCaret color={caretColor} />}
      </p>
    );
  }

  if (block.type === "blockquote") {
    const items = block.items ?? [];
    return (
      <blockquote
        key={bi}
        className="my-2 py-2 pr-3 rounded-r-lg"
        style={{
          paddingLeft: "var(--cx-space-4, 16px)",
          borderLeft: "3px solid var(--cx-accent)",
          background: "var(--cx-accent-tint)",
        }}
      >
        {items.map((line, li) => {
          const isLast = li === items.length - 1;
          return (
            <p
              key={li}
              className="cx-body"
              style={{ color: "var(--cx-text-muted)" }}
            >
              {renderSegments(parseInline(line), `bq${bi}-${li}`)}
              {caretColor && isLast && <StreamingCaret color={caretColor} />}
            </p>
          );
        })}
      </blockquote>
    );
  }

  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    const items = block.items ?? [];
    return (
      <Tag
        key={bi}
        className={block.ordered ? "list-decimal space-y-1" : "list-disc space-y-1"}
        style={{
          color: "var(--cx-text)",
          paddingLeft: "var(--cx-space-4, 16px)",
          margin: "var(--cx-space-2, 8px) 0",
        }}
      >
        {items.map((item, li) => {
          const isLast = li === items.length - 1;
          const segs = parseInline(item);
          return (
            <li
              key={li}
              style={{
                fontSize: "var(--cx-type-sm, 13px)",
                lineHeight: "var(--cx-lh-body, 1.60)",
              }}
            >
              {renderSegments(segs, `li${bi}-${li}`)}
              {caretColor && isLast && <StreamingCaret color={caretColor} />}
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
          className="w-full cx-type-base border-collapse"
          style={{ borderColor: "var(--cx-border)" }}
        >
          <thead>
            <tr>
              {(block.headers ?? []).map((h, ci) => (
                <th
                  key={ci}
                  className="px-4 py-2.5 text-left cx-type-xs uppercase tracking-[0.12em] font-semibold"
                  style={{
                    background: "var(--cx-surface-overlay)",
                    borderBottom: "1px solid var(--cx-border-strong)",
                    borderRight:
                      ci < (block.headers ?? []).length - 1
                        ? "1px solid var(--cx-border)"
                        : "none",
                    color: "var(--cx-text-muted)",
                  }}
                >
                  {renderSegments(parseInline(h), `th${bi}-${ci}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(block.rows ?? []).map((row, ri) => {
              const isLastRow = ri === (block.rows ?? []).length - 1;
              return (
                <tr
                  key={ri}
                  style={{
                    background:
                      ri % 2 === 0
                        ? "transparent"
                        : "var(--cx-surface-raised)",
                  }}
                >
                  {row.map((cell, ci) => {
                    const isLastCell = ci === row.length - 1;
                    return (
                      <td
                        key={ci}
                        className="px-4 py-2"
                        style={{
                          border: "1px solid var(--cx-border)",
                          color: "var(--cx-text)",
                          fontSize: "var(--cx-type-sm, 13px)",
                        }}
                      >
                        {renderSegments(parseInline(cell), `td${bi}-${ri}-${ci}`)}
                        {caretColor && isLastRow && isLastCell && (
                          <StreamingCaret color={caretColor} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
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
      style={{
        fontSize: "var(--cx-type-sm, 13px)",
        lineHeight: "var(--cx-lh-body, 1.60)",
        color: "var(--cx-text)",
      }}
    >
      {renderSegments(segs, `p${bi}`)}
      {caretColor && <StreamingCaret color={caretColor} />}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  content: string;
  /** When true, render as progressive markdown with a blinking caret. */
  streaming?: boolean;
  /** Accent color for the blinking caret (used only when streaming=true). */
  caretColor?: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  streaming = false,
  caretColor,
}: Props) {
  if (streaming) {
    // Progressive streaming: parse as markdown and place the caret at the end
    // of the last block. This gives users live formatting (headings, lists, code)
    // as tokens arrive, without waiting for stream completion.
    const blocks = parseBlocks(content);

    if (blocks.length === 0) {
      // No complete blocks yet — show raw tail with caret
      return (
        <span
          className="whitespace-pre-wrap leading-relaxed"
          style={{
            fontSize: "var(--cx-type-sm, 13px)",
            lineHeight: "var(--cx-lh-body, 1.60)",
            color: "var(--cx-text)",
          }}
        >
          {content}
          {caretColor && <StreamingCaret color={caretColor} />}
        </span>
      );
    }

    return (
      <div className="markdown-body leading-relaxed space-y-2">
        {blocks.map((block, bi) => {
          const isLast = bi === blocks.length - 1;
          return renderBlock(block, bi, isLast ? caretColor : undefined);
        })}
      </div>
    );
  }

  const blocks = parseBlocks(content);

  return (
    <div className="markdown-body leading-relaxed space-y-2">
      {blocks.map((block, bi) => renderBlock(block, bi))}
    </div>
  );
});
