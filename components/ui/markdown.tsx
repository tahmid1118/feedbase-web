import { Fragment, type ReactNode } from "react";

/**
 * Minimal, dependency-free Markdown renderer covering the subset used by
 * changelog content: headings, unordered/ordered lists, bold/italic/code spans,
 * and paragraphs. It intentionally does not handle the full spec.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Order matters: process code spans first so their contents are left intact.
  const tokens: ReactNode[] = [];
  const regex =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(
        <Fragment key={`${keyPrefix}-t-${i}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>
      );
    }
    const token = match[0];
    if (token.startsWith("`")) {
      tokens.push(
        <code
          key={`${keyPrefix}-c-${i}`}
          className="rounded bg-[#fdf8f9] px-1.5 py-0.5 text-sm text-[#c74959]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      tokens.push(
        <strong key={`${keyPrefix}-b-${i}`}>{token.slice(2, -2)}</strong>
      );
    } else if (token.startsWith("*")) {
      tokens.push(<em key={`${keyPrefix}-i-${i}`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("[")) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (linkMatch) {
        tokens.push(
          <a
            key={`${keyPrefix}-l-${i}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="text-[#c74959] underline"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }
    lastIndex = regex.lastIndex;
    i += 1;
  }

  if (lastIndex < text.length) {
    tokens.push(
      <Fragment key={`${keyPrefix}-t-end`}>{text.slice(lastIndex)}</Fragment>
    );
  }

  return tokens;
}

export function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!listBuffer) return;
    const items = listBuffer.items.map((item, idx) => (
      <li key={`${key}-li-${idx}`} className="ml-1">
        {renderInline(item, `${key}-${idx}`)}
      </li>
    ));
    blocks.push(
      listBuffer.ordered ? (
        <ol key={key} className="ml-5 list-decimal space-y-1 text-[#1c0a0c]/80">
          {items}
        </ol>
      ) : (
        <ul key={key} className="ml-5 list-disc space-y-1 text-[#1c0a0c]/80">
          {items}
        </ul>
      )
    );
    listBuffer = null;
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trimEnd();
    const key = `block-${index}`;

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const ordered = /^\d+\.\s+(.*)$/.exec(line);

    if (heading) {
      flushList(`${key}-pre`);
      const level = heading[1].length;
      const sizes: Record<number, string> = {
        1: "text-2xl font-bold",
        2: "text-xl font-semibold",
        3: "text-lg font-semibold",
      };
      blocks.push(
        <p
          key={key}
          className={`mt-4 mb-1 text-[#1c0a0c] ${sizes[level] ?? "text-base font-semibold"}`}
        >
          {renderInline(heading[2], key)}
        </p>
      );
    } else if (bullet) {
      if (!listBuffer || listBuffer.ordered) {
        flushList(`${key}-pre`);
        listBuffer = { ordered: false, items: [] };
      }
      listBuffer.items.push(bullet[1]);
    } else if (ordered) {
      if (!listBuffer || !listBuffer.ordered) {
        flushList(`${key}-pre`);
        listBuffer = { ordered: true, items: [] };
      }
      listBuffer.items.push(ordered[1]);
    } else if (line.trim() === "") {
      flushList(key);
    } else {
      flushList(`${key}-pre`);
      blocks.push(
        <p key={key} className="text-[#1c0a0c]/80">
          {renderInline(line, key)}
        </p>
      );
    }
  });

  flushList("block-final");

  return <div className="space-y-2 leading-relaxed">{blocks}</div>;
}
