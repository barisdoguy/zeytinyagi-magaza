import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DraftNotice } from "@/components/site/DraftNotice";
import { RichText } from "@/components/site/RichText";
import { LEGAL_SLUGS } from "@/lib/content/seed-pages";
import { getPage } from "@/lib/pages";

type Props = { params: Promise<{ slug: string }> };

const isLegal = (slug: string) => (LEGAL_SLUGS as readonly string[]).includes(slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = isLegal(slug) ? getPage(slug) : null;
  if (!page) return { title: "Sayfa bulunamadı" };
  return {
    title: page.title,
    alternates: { canonical: `/${slug}` },
    robots: page.status === "published" ? undefined : { index: false, follow: true },
  };
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const page = isLegal(slug) ? getPage(slug) : null;
  if (!page) notFound();
  return (
    <div className="wrap max-w-3xl py-12 md:py-20">
      <h1 className="mb-8 text-5xl md:text-6xl">{page.title}</h1>
      {page.status !== "published" && <DraftNotice />}
      <RichText body={page.body} />
    </div>
  );
}
