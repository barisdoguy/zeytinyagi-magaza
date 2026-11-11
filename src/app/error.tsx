"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="wrap flex-1 py-24">
      <h1 className="text-5xl">Bir şeyler ters gitti</h1>
      <p className="mt-4 max-w-md text-lg">Sayfa yüklenirken beklenmeyen bir sorun oluştu. Lütfen yeniden deneyin.</p>
      <button type="button" className="btn btn-dark mt-8" onClick={() => reset()}>Yeniden dene</button>
    </main>
  );
}
