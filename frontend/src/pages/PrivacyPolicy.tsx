import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const [language, setLanguage] = useState<'pl' | 'en'>('pl');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2"
            >
              ← {language === 'pl' ? 'Powrót do strony głównej' : 'Back to home'}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('pl')}
                className={`px-4 py-2 rounded ${
                  language === 'pl'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Polski
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded ${
                  language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                English
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {language === 'pl' ? 'Polityka Prywatności' : 'Privacy Policy'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {language === 'pl' 
              ? 'Ostatnia aktualizacja: 29 października 2025' 
              : 'Last updated: October 29, 2025'}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 prose dark:prose-invert max-w-none
                        prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                        prose-p:text-gray-700 dark:prose-p:text-gray-300
                        prose-li:text-gray-700 dark:prose-li:text-gray-300
                        prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                        prose-a:text-blue-600 dark:prose-a:text-blue-400 
                        prose-a:no-underline hover:prose-a:underline">
          {language === 'pl' ? <PolishPrivacyPolicy /> : <EnglishPrivacyPolicy />}
        </div>
      </div>
    </div>
  );
};

const PolishPrivacyPolicy = () => (
  <>
    <h2>1. Wprowadzenie</h2>
    <p>
      Niniejsza Polityka Prywatności opisuje, w jaki sposób Antystyki ("my", "nas", "nasz") 
      zbiera, wykorzystuje, przechowuje i chroni Twoje dane osobowe podczas korzystania z 
      naszej platformy internetowej (dalej: "Serwis").
    </p>
    <p>
      Zobowiązujemy się do ochrony Twojej prywatności zgodnie z Rozporządzeniem Parlamentu 
      Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób 
      fizycznych w związku z przetwarzaniem danych osobowych (RODO/GDPR).
    </p>

    <h2>2. Administrator Danych</h2>
    <p>
      <strong>Administrator danych osobowych:</strong><br />
      Antystyki<br />
      Email kontaktowy: privacy@antystyki.pl<br />
      W sprawach związanych z ochroną danych osobowych prosimy o kontakt pod powyższym adresem.
    </p>

    <h2>3. Jakie Dane Zbieramy</h2>
    
    <h3>3.1 Dane Podawane Bezpośrednio</h3>
    <p>Podczas rejestracji i korzystania z Serwisu zbieramy:</p>
    <ul>
      <li><strong>Dane konta:</strong> nazwa użytkownika, adres email, zaszyfrowane hasło</li>
      <li><strong>Dane treści:</strong> antystyki (statystyki), komentarze, opinie</li>
      <li><strong>Dane interakcji:</strong> polubienia, zgłoszenia, oceny treści</li>
    </ul>

    <h3>3.2 Dane Zbierane Automatycznie</h3>
    <ul>
      <li><strong>Dane techniczne:</strong> adres IP (zanonimizowany), typ przeglądarki, system operacyjny</li>
      <li><strong>Dane użytkowania:</strong> czas wizyty, odwiedzone strony, akcje w Serwisie</li>
      <li><strong>Dane analityczne:</strong> Google Analytics 4 - szczegóły w sekcji 7.2</li>
      <li><strong>Pliki cookies:</strong> szczegóły w sekcji 7</li>
    </ul>

    <h3>3.3 Dane NIE Zbierane</h3>
    <p>
      <strong>Nie zbieramy danych wrażliwych</strong> (pochodzenie rasowe lub etniczne, przekonania 
      polityczne, religijne, dane o zdrowiu, orientacji seksualnej) chyba że Użytkownik dobrowolnie 
      umieści je w publicznej treści.
    </p>

    <h2>4. Podstawy Prawne Przetwarzania (GDPR)</h2>
    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
      <thead>
        <tr className="bg-gray-100 dark:bg-gray-700">
          <th className="border border-gray-300 dark:border-gray-600 p-2">Cel przetwarzania</th>
          <th className="border border-gray-300 dark:border-gray-600 p-2">Podstawa prawna</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Rejestracja i logowanie</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Umowa (Art. 6(1)(b) GDPR)</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Weryfikacja emaila</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Umowa (Art. 6(1)(b) GDPR)</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Moderacja treści</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Prawnie uzasadniony interes (Art. 6(1)(f) GDPR)</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Marketing (jeśli wyraziłeś zgodę)</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Zgoda (Art. 6(1)(a) GDPR)</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Bezpieczeństwo i ochrona przed nadużyciami</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Prawnie uzasadniony interes (Art. 6(1)(f) GDPR)</td>
        </tr>
      </tbody>
    </table>

    <h2>5. Jak Wykorzystujemy Twoje Dane</h2>
    <ul>
      <li><strong>Świadczenie usług:</strong> Umożliwienie rejestracji, logowania, tworzenia i przeglądania treści</li>
      <li><strong>Komunikacja:</strong> Wysyłanie powiadomień o weryfikacji konta, zmianach w Serwisie</li>
      <li><strong>Moderacja:</strong> Przegląd i zatwierdzanie zgłaszanych treści, zapobieganie nadużyciom</li>
      <li><strong>Bezpieczeństwo:</strong> Wykrywanie i zapobieganie oszustwom, spam, naruszeniom regulaminu</li>
      <li><strong>Analityka:</strong> Zrozumienie sposobu korzystania z Serwisu w celu jego ulepszania</li>
      <li><strong>Obowiązki prawne:</strong> Wypełnianie wymogów prawnych (np. przechowywanie danych księgowych)</li>
    </ul>

    <h2>6. Udostępnianie Danych</h2>
    
    <h3>6.1 Kiedy Udostępniamy Dane</h3>
    <p>Twoje dane osobowe mogą być udostępniane:</p>
    <ul>
      <li><strong>Dostawcom usług:</strong> Hosting (Kamatera Cloud), email (SendGrid/Gmail), analityka (Google Analytics)</li>
      <li><strong>Organom prawnym:</strong> Gdy jest to wymagane przez prawo lub w odpowiedzi na ważne żądania prawne</li>
      <li><strong>W przypadku reorganizacji:</strong> W razie fuzji, przejęcia lub sprzedaży aktywów</li>
    </ul>

    <h3>6.2 Kiedy NIE Udostępniamy Danych</h3>
    <ul>
      <li>Nie sprzedajemy Twoich danych osobowych osobom trzecim</li>
      <li>Nie udostępniamy danych do celów marketingowych bez Twojej zgody</li>
      <li>Nie przekazujemy danych poza EOG bez odpowiednich zabezpieczeń (standardowe klauzule umowne)</li>
    </ul>

    <h2>7. Pliki Cookies</h2>
    
    <h3>7.1 Czym są Cookies</h3>
    <p>
      Cookies to małe pliki tekstowe zapisywane na Twoim urządzeniu przez przeglądarkę internetową.
    </p>

    <h3>7.2 Jakie Cookies Używamy</h3>
    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
      <thead>
        <tr className="bg-gray-100 dark:bg-gray-700">
          <th className="border border-gray-300 dark:border-gray-600 p-2">Rodzaj</th>
          <th className="border border-gray-300 dark:border-gray-600 p-2">Cel</th>
          <th className="border border-gray-300 dark:border-gray-600 p-2">Ważność</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Niezbędne</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Uwierzytelnianie, sesja użytkownika</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">7 dni</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Funkcjonalne</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Zapamiętywanie preferencji (język, motyw)</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">30 dni</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Analityczne</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Google Analytics (anonimizowane)</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">2 lata</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Reklamowe</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Google AdSense (za zgodą)</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">2 lata</td>
        </tr>
      </tbody>
    </table>

    <h3>7.3 Google Analytics 4</h3>
    <p>
      Używamy Google Analytics 4 do analizy ruchu na stronie i zrozumienia zachowań użytkowników. 
      To pomaga nam ulepszyć Serwis i dostosować go do Twoich potrzeb.
    </p>
    
    <h4>Jakie dane zbiera Google Analytics:</h4>
    <ul>
      <li>Informacje o odwiedzonych stronach i czasie wizyty</li>
      <li>Typ urządzenia, przeglądarki i systemu operacyjnego</li>
      <li>Zanonimizowany adres IP (ostatnie oktety są usuwane)</li>
      <li>Źródło ruchu (np. wyszukiwarka, link bezpośredni)</li>
      <li>Interakcje z elementami strony (kliknięcia, polubienia, komentarze)</li>
    </ul>
    
    <h4>Dane NIE zbierane przez Google Analytics:</h4>
    <ul>
      <li>Pełny adres IP (jest anonimizowany)</li>
      <li>Hasła lub dane uwierzytelniające</li>
      <li>Treść komentarzy lub utworzonych antystyków</li>
      <li>Dane osobowe umożliwiające Twoją identyfikację</li>
    </ul>
    
    <h4>Twoja kontrola:</h4>
    <ul>
      <li><strong>Zgoda:</strong> Przed rozpoczęciem śledzenia pytamy o zgodę przez banner cookies</li>
      <li><strong>Opt-out:</strong> Możesz wycofać zgodę w każdej chwili przez ustawienia przeglądarki</li>
      <li><strong>Google Opt-out:</strong> Zainstaluj wtyczkę: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analytics Opt-out Browser Add-on</a></li>
    </ul>
    
    <p>
      <strong>Podstawa prawna:</strong> Zgoda (Art. 6(1)(a) GDPR)<br />
      <strong>Okres przechowywania:</strong> 26 miesięcy (ustawienie Google Analytics)<br />
      <strong>Polityka prywatności Google:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a>
    </p>

    <h3>7.4 Zarządzanie Cookies</h3>
    <p>
      Możesz zarządzać cookies w ustawieniach przeglądarki. Blokada wszystkich cookies może 
      wpłynąć na funkcjonalność Serwisu.
    </p>

    <h2>8. Twoje Prawa (GDPR)</h2>
    <p>Zgodnie z GDPR masz prawo do:</p>
    <ul>
      <li><strong>Dostępu (Art. 15):</strong> Otrzymania kopii swoich danych osobowych</li>
      <li><strong>Sprostowania (Art. 16):</strong> Poprawienia nieprawidłowych danych</li>
      <li><strong>Usunięcia (Art. 17 - "prawo do bycia zapomnianym"):</strong> Usunięcia danych w określonych przypadkach</li>
      <li><strong>Ograniczenia (Art. 18):</strong> Ograniczenia przetwarzania danych</li>
      <li><strong>Przenoszenia (Art. 20):</strong> Otrzymania danych w formacie strukturalnym</li>
      <li><strong>Sprzeciwu (Art. 21):</strong> Sprzeciwu wobec przetwarzania w określonych celach</li>
      <li><strong>Cofnięcia zgody (Art. 7(3)):</strong> Wycofania zgody w dowolnym momencie</li>
      <li><strong>Skargi (Art. 77):</strong> Złożenia skargi do organu nadzorczego (UODO w Polsce)</li>
    </ul>

    <h3>8.1 Jak Skorzystać z Praw</h3>
    <p>
      Aby skorzystać z powyższych praw, wyślij email na: <strong>privacy@antystyki.pl</strong><br />
      Odpowiemy w ciągu <strong>30 dni</strong> zgodnie z wymogami GDPR.
    </p>

    <h2>9. Przechowywanie Danych</h2>
    
    <h3>9.1 Okres Przechowywania</h3>
    <ul>
      <li><strong>Konto aktywne:</strong> Dopóki nie usuniesz konta</li>
      <li><strong>Konto nieaktywne:</strong> 3 lata od ostatniego logowania, następnie automatyczne usunięcie</li>
      <li><strong>Publiczne treści:</strong> Dopóki nie zostaną usunięte przez Ciebie lub moderatora</li>
      <li><strong>Logi bezpieczeństwa:</strong> 90 dni</li>
      <li><strong>Dane księgowe:</strong> Zgodnie z wymogami prawnymi (5-10 lat)</li>
    </ul>

    <h3>9.2 Usuwanie Danych</h3>
    <p>
      Możesz w każdej chwili usunąć swoje konto w ustawieniach profilu. Spowoduje to:
    </p>
    <ul>
      <li>Trwałe usunięcie danych konta (email, hasło)</li>
      <li>Anonimizację publicznych treści (nazwa użytkownika zmieniona na "Użytkownik usunięty")</li>
      <li>Usunięcie danych osobowych w ciągu 30 dni</li>
    </ul>

    <h2>10. Bezpieczeństwo Danych</h2>
    <p>Stosujemy następujące środki bezpieczeństwa:</p>
    <ul>
      <li><strong>Szyfrowanie:</strong> HTTPS/TLS dla wszystkich połączeń</li>
      <li><strong>Hasła:</strong> Haszowane z wykorzystaniem bcrypt (nie przechowujemy haseł w czystym tekście)</li>
      <li><strong>Kopie zapasowe:</strong> Codzienne zaszyfrowane kopie zapasowe</li>
      <li><strong>Kontrola dostępu:</strong> Ograniczony dostęp do danych tylko dla upoważnionego personelu</li>
      <li><strong>Monitorowanie:</strong> Logowanie i monitorowanie dostępu do systemów</li>
      <li><strong>Aktualizacje:</strong> Regularne aktualizacje oprogramowania i łatanie luk bezpieczeństwa</li>
    </ul>

    <h2>11. Użytkownicy Poniżej 16 Roku Życia</h2>
    <p>
      Serwis nie jest przeznaczony dla osób poniżej 16 roku życia. Nie zbieramy świadomie 
      danych osobowych dzieci bez zgody rodziców/opiekunów. Jeśli dowiesz się, że Twoje 
      dziecko przekazało nam dane bez zgody, skontaktuj się z nami.
    </p>

    <h2>12. Międzynarodowe Transfery Danych</h2>
    <p>
      Twoje dane są przechowywane na serwerach w Europejskim Obszarze Gospodarczym (EOG). 
      Jeśli korzystamy z dostawców spoza EOG (np. Google Analytics), stosujemy standardowe 
      klauzule umowne zatwierdzone przez Komisję Europejską.
    </p>

    <h2>13. Zmiany w Polityce Prywatności</h2>
    <p>
      Możemy okresowo aktualizować niniejszą Politykę Prywatności. O istotnych zmianach 
      powiadomimy Cię przez email lub powiadomienie w Serwisie. Kontynuując korzystanie 
      z Serwisu po zmianach, akceptujesz zaktualizowaną politykę.
    </p>

    <h2>14. Kontakt</h2>
    <p>
      W razie pytań dotyczących niniejszej Polityki Prywatności lub przetwarzania danych, 
      skontaktuj się z nami:
    </p>
    <ul>
      <li><strong>Email:</strong> privacy@antystyki.pl</li>
      <li><strong>Czas odpowiedzi:</strong> Do 30 dni</li>
    </ul>

    <h2>15. Organ Nadzorczy</h2>
    <p>
      Masz prawo złożyć skargę do organu nadzorczego ds. ochrony danych osobowych:
    </p>
    <p>
      <strong>Urząd Ochrony Danych Osobowych (UODO)</strong><br />
      ul. Stawki 2<br />
      00-193 Warszawa, Polska<br />
      Tel: +48 22 531 03 00<br />
      Email: kancelaria@uodo.gov.pl<br />
      Web: <a href="https://uodo.gov.pl" target="_blank" rel="noopener noreferrer">https://uodo.gov.pl</a>
    </p>

    <p className="text-sm text-gray-600 dark:text-gray-400 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
      <strong>Data ostatniej aktualizacji:</strong> 29 października 2025<br />
      <strong>Wersja:</strong> 1.1<br />
      <strong>Status:</strong> Obowiązująca
    </p>
  </>
);

const EnglishPrivacyPolicy = () => (
  <>
    <h2>1. Introduction</h2>
    <p>
      This Privacy Policy describes how Antystyki ("we", "us", "our") collects, uses, 
      stores, and protects your personal data when using our web platform (the "Service").
    </p>
    <p>
      We are committed to protecting your privacy in accordance with the General Data 
      Protection Regulation (GDPR) - Regulation (EU) 2016/679 of the European Parliament 
      and of the Council.
    </p>

    <h2>2. Data Controller</h2>
    <p>
      <strong>Data Controller:</strong><br />
      Antystyki<br />
      Contact email: privacy@antystyki.pl<br />
      For data protection matters, please contact us at the above address.
    </p>

    <h2>3. What Data We Collect</h2>
    
    <h3>3.1 Data You Provide Directly</h3>
    <p>When registering and using the Service, we collect:</p>
    <ul>
      <li><strong>Account data:</strong> username, email address, encrypted password</li>
      <li><strong>Content data:</strong> antistics (statistics), comments, reviews</li>
      <li><strong>Interaction data:</strong> likes, reports, content ratings</li>
    </ul>

    <h3>3.2 Data Collected Automatically</h3>
    <ul>
      <li><strong>Technical data:</strong> IP address (anonymized), browser type, operating system</li>
      <li><strong>Usage data:</strong> visit time, pages viewed, actions in the Service</li>
      <li><strong>Analytics data:</strong> Google Analytics 4 - details in section 7.2</li>
      <li><strong>Cookies:</strong> details in section 7</li>
    </ul>

    <h3>3.3 Data NOT Collected</h3>
    <p>
      <strong>We do not collect sensitive data</strong> (racial or ethnic origin, political 
      opinions, religious beliefs, health data, sexual orientation) unless a User voluntarily 
      includes it in public content.
    </p>

    <h2>4. Legal Bases for Processing (GDPR)</h2>
    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
      <thead>
        <tr className="bg-gray-100 dark:bg-gray-700">
          <th className="border border-gray-300 dark:border-gray-600 p-2">Processing purpose</th>
          <th className="border border-gray-300 dark:border-gray-600 p-2">Legal basis</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Registration and login</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Contract (Art. 6(1)(b) GDPR)</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Email verification</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Contract (Art. 6(1)(b) GDPR)</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Content moderation</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Legitimate interest (Art. 6(1)(f) GDPR)</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Marketing (if consented)</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Consent (Art. 6(1)(a) GDPR)</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Security and abuse prevention</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Legitimate interest (Art. 6(1)(f) GDPR)</td>
        </tr>
      </tbody>
    </table>

    <h2>5. How We Use Your Data</h2>
    <ul>
      <li><strong>Service provision:</strong> Enable registration, login, content creation and browsing</li>
      <li><strong>Communication:</strong> Send account verification, service updates</li>
      <li><strong>Moderation:</strong> Review and approve submitted content, prevent abuse</li>
      <li><strong>Security:</strong> Detect and prevent fraud, spam, terms violations</li>
      <li><strong>Analytics:</strong> Understand Service usage to improve it</li>
      <li><strong>Legal obligations:</strong> Comply with legal requirements (e.g., accounting records)</li>
    </ul>

    <h2>6. Data Sharing</h2>
    
    <h3>6.1 When We Share Data</h3>
    <p>Your personal data may be shared with:</p>
    <ul>
      <li><strong>Service providers:</strong> Hosting (Kamatera Cloud), email (SendGrid/Gmail), analytics (Google Analytics)</li>
      <li><strong>Legal authorities:</strong> When required by law or in response to valid legal requests</li>
      <li><strong>In case of reorganization:</strong> In the event of merger, acquisition, or asset sale</li>
    </ul>

    <h3>6.2 When We Do NOT Share Data</h3>
    <ul>
      <li>We do not sell your personal data to third parties</li>
      <li>We do not share data for marketing purposes without your consent</li>
      <li>We do not transfer data outside the EEA without appropriate safeguards (standard contractual clauses)</li>
    </ul>

    <h2>7. Cookies</h2>
    
    <h3>7.1 What Are Cookies</h3>
    <p>
      Cookies are small text files stored on your device by your web browser.
    </p>

    <h3>7.2 Cookies We Use</h3>
    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
      <thead>
        <tr className="bg-gray-100 dark:bg-gray-700">
          <th className="border border-gray-300 dark:border-gray-600 p-2">Type</th>
          <th className="border border-gray-300 dark:border-gray-600 p-2">Purpose</th>
          <th className="border border-gray-300 dark:border-gray-600 p-2">Duration</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Essential</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Authentication, user session</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">7 days</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Functional</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Remember preferences (language, theme)</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">30 days</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Analytics</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Google Analytics (anonymized)</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">2 years</td>
        </tr>
        <tr>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Advertising</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">Google AdSense (with consent)</td>
          <td className="border border-gray-300 dark:border-gray-600 p-2">2 years</td>
        </tr>
      </tbody>
    </table>

    <h3>7.3 Google Analytics 4</h3>
    <p>
      We use Google Analytics 4 to analyze website traffic and understand user behavior. 
      This helps us improve the Service and tailor it to your needs.
    </p>
    
    <h4>What data Google Analytics collects:</h4>
    <ul>
      <li>Information about visited pages and visit duration</li>
      <li>Device type, browser, and operating system</li>
      <li>Anonymized IP address (last octets are removed)</li>
      <li>Traffic source (e.g., search engine, direct link)</li>
      <li>Interactions with page elements (clicks, likes, comments)</li>
    </ul>
    
    <h4>Data NOT collected by Google Analytics:</h4>
    <ul>
      <li>Full IP address (it is anonymized)</li>
      <li>Passwords or authentication credentials</li>
      <li>Content of comments or created antistics</li>
      <li>Personal data enabling your identification</li>
    </ul>
    
    <h4>Your control:</h4>
    <ul>
      <li><strong>Consent:</strong> We ask for consent through a cookie banner before tracking begins</li>
      <li><strong>Opt-out:</strong> You can withdraw consent anytime through browser settings</li>
      <li><strong>Google Opt-out:</strong> Install plugin: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analytics Opt-out Browser Add-on</a></li>
    </ul>
    
    <p>
      <strong>Legal basis:</strong> Consent (Art. 6(1)(a) GDPR)<br />
      <strong>Retention period:</strong> 26 months (Google Analytics setting)<br />
      <strong>Google Privacy Policy:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a>
    </p>

    <h3>7.4 Managing Cookies</h3>
    <p>
      You can manage cookies in your browser settings. Blocking all cookies may affect 
      Service functionality.
    </p>

    <h2>8. Your Rights (GDPR)</h2>
    <p>Under GDPR, you have the right to:</p>
    <ul>
      <li><strong>Access (Art. 15):</strong> Receive a copy of your personal data</li>
      <li><strong>Rectification (Art. 16):</strong> Correct inaccurate data</li>
      <li><strong>Erasure (Art. 17 - "right to be forgotten"):</strong> Delete data in certain cases</li>
      <li><strong>Restriction (Art. 18):</strong> Restrict data processing</li>
      <li><strong>Portability (Art. 20):</strong> Receive data in a structured format</li>
      <li><strong>Object (Art. 21):</strong> Object to processing for certain purposes</li>
      <li><strong>Withdraw consent (Art. 7(3)):</strong> Withdraw consent at any time</li>
      <li><strong>Complaint (Art. 77):</strong> Lodge a complaint with a supervisory authority</li>
    </ul>

    <h3>8.1 How to Exercise Your Rights</h3>
    <p>
      To exercise the above rights, send an email to: <strong>privacy@antystyki.pl</strong><br />
      We will respond within <strong>30 days</strong> as required by GDPR.
    </p>

    <h2>9. Data Retention</h2>
    
    <h3>9.1 Retention Period</h3>
    <ul>
      <li><strong>Active account:</strong> Until you delete your account</li>
      <li><strong>Inactive account:</strong> 3 years from last login, then automatic deletion</li>
      <li><strong>Public content:</strong> Until deleted by you or a moderator</li>
      <li><strong>Security logs:</strong> 90 days</li>
      <li><strong>Accounting data:</strong> As required by law (5-10 years)</li>
    </ul>

    <h3>9.2 Data Deletion</h3>
    <p>
      You can delete your account at any time in profile settings. This will:
    </p>
    <ul>
      <li>Permanently delete account data (email, password)</li>
      <li>Anonymize public content (username changed to "Deleted User")</li>
      <li>Delete personal data within 30 days</li>
    </ul>

    <h2>10. Data Security</h2>
    <p>We implement the following security measures:</p>
    <ul>
      <li><strong>Encryption:</strong> HTTPS/TLS for all connections</li>
      <li><strong>Passwords:</strong> Hashed using bcrypt (we don't store passwords in plain text)</li>
      <li><strong>Backups:</strong> Daily encrypted backups</li>
      <li><strong>Access control:</strong> Limited access to data for authorized personnel only</li>
      <li><strong>Monitoring:</strong> Logging and monitoring of system access</li>
      <li><strong>Updates:</strong> Regular software updates and security patching</li>
    </ul>

    <h2>11. Users Under 16</h2>
    <p>
      The Service is not intended for persons under 16 years of age. We do not knowingly 
      collect personal data from children without parental/guardian consent. If you learn 
      that your child has provided us with data without consent, please contact us.
    </p>

    <h2>12. International Data Transfers</h2>
    <p>
      Your data is stored on servers in the European Economic Area (EEA). If we use 
      providers outside the EEA (e.g., Google Analytics), we use standard contractual 
      clauses approved by the European Commission.
    </p>

    <h2>13. Changes to Privacy Policy</h2>
    <p>
      We may periodically update this Privacy Policy. We will notify you of significant 
      changes by email or notification in the Service. By continuing to use the Service 
      after changes, you accept the updated policy.
    </p>

    <h2>14. Contact</h2>
    <p>
      If you have questions about this Privacy Policy or data processing, contact us:
    </p>
    <ul>
      <li><strong>Email:</strong> privacy@antystyki.pl</li>
      <li><strong>Response time:</strong> Up to 30 days</li>
    </ul>

    <h2>15. Supervisory Authority</h2>
    <p>
      You have the right to lodge a complaint with a data protection supervisory authority:
    </p>
    <p>
      <strong>Personal Data Protection Office (UODO)</strong><br />
      ul. Stawki 2<br />
      00-193 Warsaw, Poland<br />
      Tel: +48 22 531 03 00<br />
      Email: kancelaria@uodo.gov.pl<br />
      Web: <a href="https://uodo.gov.pl" target="_blank" rel="noopener noreferrer">https://uodo.gov.pl</a>
    </p>

    <p className="text-sm text-gray-600 dark:text-gray-400 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
      <strong>Last updated:</strong> October 29, 2025<br />
      <strong>Version:</strong> 1.1<br />
      <strong>Status:</strong> Active
    </p>
  </>
);

export default PrivacyPolicy;

