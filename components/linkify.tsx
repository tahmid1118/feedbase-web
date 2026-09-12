import * as React from "react";

/**
 * Turns bare URLs in USER-SUBMITTED text into clickable links.
 *
 * Renders real React `<a>` elements from parsed segments — never
 * `dangerouslySetInnerHTML`. Building an HTML string out of someone's comment
 * would be a stored-XSS hole on a board whose entire premise is that strangers
 * can post to it; here React escapes every text segment, so `<img onerror=…>`
 * in a comment stays literal text.
 *
 * The pattern only matches `http(s)://…` and bare `www.…`, which is also the
 * scheme defence: `javascript:` and `data:` can never match, so there is no
 * separate sanitiser to keep in sync. A `www.` match is prefixed with https.
 *
 * Links carry `nofollow ugc` as well as `noopener noreferrer` — a public board
 * is indexed, and without it every spam comment that slips past the filter
 * would pass link authority.
 */
const URL_RE = /((?:https?:\/\/|www\.)[^\s<>"']+)/gi;

/**
 * Splits trailing sentence punctuation off a matched URL: in
 * "see https://example.com/a." the full stop is prose, not part of the link.
 * A closing bracket is only trimmed when the URL didn't open one, so
 * Wikipedia-style `…/Foo_(bar)` links survive intact.
 */
function splitTrailingPunctuation(raw: string): [url: string, tail: string] {
  let url = raw;
  let tail = "";
  for (;;) {
    const last = url.at(-1);
    if (!last) break;
    if (".,;:!?'\"".includes(last)) {
      tail = last + tail;
      url = url.slice(0, -1);
      continue;
    }
    if (last === ")") {
      const opens = (url.match(/\(/g) ?? []).length;
      const closes = (url.match(/\)/g) ?? []).length;
      if (closes > opens) {
        tail = last + tail;
        url = url.slice(0, -1);
        continue;
      }
    }
    break;
  }
  return [url, tail];
}

export function Linkify({
  children,
  color,
}: {
  children: string | null | undefined;
  /** Tenant brand colour on the public portal; falls back to the app rose. */
  color?: string;
}) {
  const text = children ?? "";
  if (!text) return null;

  const out: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(URL_RE)) {
    const start = match.index ?? 0;
    const [url, tail] = splitTrailingPunctuation(match[0]);
    if (!url) continue;

    if (start > cursor) out.push(text.slice(cursor, start));
    out.push(
      <a
        key={`${start}-${url}`}
        href={url.startsWith("www.") ? `https://${url}` : url}
        target="_blank"
        rel="nofollow ugc noopener noreferrer"
        className="underline underline-offset-2 hover:opacity-80"
        style={{ color: color || "#c74959" }}
      >
        {url}
      </a>
    );
    if (tail) out.push(tail);
    cursor = start + match[0].length;
  }

  if (cursor < text.length) out.push(text.slice(cursor));
  return <>{out}</>;
}
