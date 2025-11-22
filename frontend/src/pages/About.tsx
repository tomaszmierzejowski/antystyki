import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
          <span className="text-xs uppercase tracking-[0.35em] text-gray-400">
            O nas
          </span>
          <h1 className="mt-3 text-4xl font-bold text-gray-900 sm:text-5xl">
            Antystyki – inteligentny humor na bazie twardych danych
          </h1>
          <p className="mt-5 text-base text-gray-600 sm:text-lg">
            Budujemy społeczność, która potrafi wyśmiać polaryzację bez rezygnowania z faktów.
            Zamiast szybkich nagłówków proponujemy ironiczne historie, które zmuszają do refleksji,
            zanim klikniesz „udostępnij”.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16 space-y-12">
        <section className="grid gap-8 rounded-3xl bg-white p-8 shadow-sm sm:p-12">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Nasza misja</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Chcemy zmniejszyć polaryzację społeczną poprzez ironię, rzetelne statystyki i wspólne
              analizowanie szarości pomiędzy czernią a bielą. Korzystamy z danych publicznych, raportów
              organizacji społecznych i badań akademickich, by tworzyć treści, które rozbrajają gorące
              emocje i zachęcają do krytycznego myślenia.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Co robimy?</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>• Selekcjonujemy wiarygodne statystyki i opisujemy je w przystępny sposób.</li>
                <li>• Umożliwiamy społeczności głosowanie, komentowanie i przerabianie danych.</li>
                <li>• Monitorujemy trendy, by pokazywać co tygodniu nowe historie.</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-gray-50 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Dlaczego to działa?</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>• Humor skraca dystans, a fakty utrzymują wiarygodność.</li>
                <li>• Moderacja i weryfikacja źródeł zapobiegają fake newsom.</li>
                <li>• Otwarte narzędzia pozwalają każdemu dołożyć swoją cegiełkę.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-dashed border-gray-300 bg-white/80 p-8 sm:grid-cols-2 sm:p-12">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              Jak możesz do nas dołączyć?
            </h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Antystyki są otwarte dla wszystkich: analityków, twórców treści, społeczników i osób,
              które zwyczajnie mają dość plemiennych wojenek. Zacznij od stworzenia własnego antystyka,
              zagłosuj na statystykę, zaproponuj temat moderatorom albo podeślij znajomym zestaw danych,
              który warto opowiedzieć z przymrużeniem oka.
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-gray-900 p-6 text-gray-100">
            <h3 className="text-lg font-semibold">Szybkie linki</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link to="/topka" className="hover:underline">
                  👉 Zobacz Topkę społeczności
                </Link>
              </li>
              <li>
                <Link to="/statistics" className="hover:underline">
                  📊 Przeglądaj bazę statystyk
                </Link>
              </li>
              <li>
                <Link to="/create" className="hover:underline">
                  ✍️ Dodaj swojego antystyka
                </Link>
              </li>
              <li>
                <a
                  href="mailto:antystyki@gmail.com"
                  className="hover:underline"
                >
                  💌 Napisz do moderatorów
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm sm:p-12">
          <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Wartości, które nas prowadzą</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <article className="rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Transparentność</h3>
              <p className="mt-2 text-sm text-gray-600">
                Źródła danych są jawne, a każda zmiana w antytyce ma historię moderacji.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Rzetelność</h3>
              <p className="mt-2 text-sm text-gray-600">
                Priorytetem jest zgodność z faktami i wiarygodnymi raportami. Humor nigdy nie usprawiedliwia manipulacji.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Społeczność</h3>
              <p className="mt-2 text-sm text-gray-600">
                Moderatorzy, twórcy i odbiorcy współtworzą platformę – od pomysłów na statystyki po feedback po publikacji.
              </p>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;


