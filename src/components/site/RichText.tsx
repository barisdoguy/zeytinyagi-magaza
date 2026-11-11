import type { ReactNode } from "react";

/** Köşeli parantez içindeki bölümleri "tamamlanacak" olarak vurgular. */
export function inline(text: string): ReactNode[] {
  return text.split(/(\[[^\]]+\])/g).map((part, i) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <mark key={i} className="todo-mark">
        {part.slice(1, -1)}
      </mark>
    ) : (
      part
    ),
  );
}

export function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i} className={className}>
            {inline(p.trim())}
          </p>
        ))}
    </>
  );
}

export type Section = { heading: string; body: string };

/** "## Başlık" ile ayrılmış düz metni bölümlere ayırır. */
export function parseSections(body: string): { intro: string; sections: Section[] } {
  const parts = body.replace(/\r\n/g, "\n").split(/^## +/m);
  const intro = parts.shift()?.trim() ?? "";
  return {
    intro,
    sections: parts.map((part) => {
      const [heading, ...rest] = part.split("\n");
      return { heading: heading.trim(), body: rest.join("\n").trim() };
    }),
  };
}

function Block({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push(<p key={out.length}>{inline(para.join(" "))}</p>);
    if (list.length)
      out.push(
        <ul key={out.length}>
          {list.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>,
      );
    para = [];
    list = [];
  };
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      if (para.length) flush();
      list.push(trimmed.slice(2));
    } else if (trimmed === "") flush();
    else {
      if (list.length) flush();
      para.push(trimmed);
    }
  }
  flush();
  return <>{out}</>;
}

export function RichText({ body }: { body: string }) {
  const { intro, sections } = parseSections(body);
  return (
    <div className="prose-page">
      {intro && <Block text={intro} />}
      {sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          <Block text={s.body} />
        </section>
      ))}
    </div>
  );
}

export { Block as RichBlock };
