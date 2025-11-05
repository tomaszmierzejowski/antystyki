import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
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
            {language === 'pl' ? 'Regulamin Serwisu' : 'Terms of Service'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {language === 'pl' 
              ? 'Ostatnia aktualizacja: 15 października 2025' 
              : 'Last updated: October 15, 2025'}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 prose dark:prose-invert max-w-none">
          {language === 'pl' ? <PolishTermsOfService /> : <EnglishTermsOfService />}
        </div>
      </div>
    </div>
  );
};

const PolishTermsOfService = () => (
  <>
    <h2>1. Postanowienia Ogólne</h2>
    <p>
      Niniejszy Regulamin określa zasady korzystania z platformy Antystyki (dalej: "Serwis"), 
      prowadzonej pod adresem antystyki.pl. Korzystając z Serwisu, akceptujesz niniejszy 
      Regulamin w całości.
    </p>

    <h3>1.1 Definicje</h3>
    <ul>
      <li><strong>Serwis:</strong> Platforma internetowa Antystyki dostępna pod adresem antystyki.pl</li>
      <li><strong>Użytkownik:</strong> Osoba korzystająca z Serwisu, zarówno zarejestrowana jak i niezarejestrowana</li>
      <li><strong>Antystyk:</strong> Treść statystyczna z inteligentną, ironiczną interpretacją</li>
      <li><strong>Konto:</strong> Indywidualny profil Użytkownika w Serwisie</li>
      <li><strong>Administrator:</strong> Osoba zarządzająca Serwisem i moderująca treści</li>
    </ul>

    <h2>2. Misja i Cele Serwisu</h2>
    <p className="font-semibold text-lg">
      "Pokazać ludziom, że rzeczy nie są tylko czarne lub białe. Świat to wszystkie odcienie szarości."
    </p>
    <p>
      Antystyki to platforma edukacyjno-humorystyczna, która poprzez inteligentną interpretację 
      statystyk ma na celu:
    </p>
    <ul>
      <li>Redukcję polaryzacji społecznej</li>
      <li>Promowanie krytycznego myślenia</li>
      <li>Pokazywanie różnych perspektyw interpretacji danych</li>
      <li>Budowanie społeczności ceniącej niuanse i odcienie szarości</li>
    </ul>

    <h2>3. Rejestracja i Konto</h2>

    <h3>3.1 Warunki Rejestracji</h3>
    <p>Aby utworzyć konto, musisz:</p>
    <ul>
      <li>Mieć ukończone 16 lat (lub posiadać zgodę opiekuna prawnego)</li>
      <li>Podać prawdziwy adres email</li>
      <li>Wybrać unikalną nazwę użytkownika</li>
      <li>Utworzyć bezpieczne hasło (min. 8 znaków)</li>
      <li>Zweryfikować adres email poprzez link aktywacyjny</li>
      <li>Zaakceptować niniejszy Regulamin i Politykę Prywatności</li>
    </ul>

    <h3>3.2 Bezpieczeństwo Konta</h3>
    <p>Użytkownik zobowiązuje się do:</p>
    <ul>
      <li>Zachowania poufności hasła</li>
      <li>Niezwłocznego powiadomienia o nieautoryzowanym dostępie do konta</li>
      <li>Używania Serwisu zgodnie z jego przeznaczeniem</li>
    </ul>

    <h3>3.3 Odpowiedzialność za Konto</h3>
    <p>
      Użytkownik ponosi pełną odpowiedzialność za wszystkie działania wykonywane z jego konta.
    </p>

    <h2>4. Zasady Tworzenia Treści</h2>

    <h3>4.1 Wymagania Dotyczące Antystyków</h3>
    <p>Każdy antystyk musi:</p>
    <ul>
      <li><strong>Być oparty na prawdziwych danych:</strong> Statystyki muszą pochodzić z wiarygodnych źródeł</li>
      <li><strong>Zawierać źródło:</strong> Link lub odniesienie do źródła danych jest obowiązkowe</li>
      <li><strong>Być oryginalny:</strong> Plagiaty i duplikaty są zabronione</li>
      <li><strong>Mieć wartość edukacyjną:</strong> Treść powinna prowokować do myślenia</li>
      <li><strong>Być estetyczny:</strong> Odpowiednia jakość wizualna i językowa</li>
    </ul>

    <h3>4.2 Zabronione Treści</h3>
    <p>Zabrania się publikowania treści:</p>
    <ul>
      <li>Niezgodnych z prawem polskim i międzynarodowym</li>
      <li>Naruszających prawa autorskie lub inne prawa własności intelektualnej</li>
      <li>Fałszywych, wprowadzających w błąd lub dezinformacyjnych</li>
      <li>Pornograficznych, obscenicznych lub wulgarnych</li>
      <li>Propagujących przemoc, nienawiść rasową, etniczną lub religijną</li>
      <li>Dyskryminujących ze względu na płeć, orientację seksualną, niepełnosprawność</li>
      <li>Obrażających, zniesławiających lub naruszających prywatność osób trzecich</li>
      <li>Spam, reklamy komercyjne bez zgody Administratora</li>
      <li>Zawierających złośliwe oprogramowanie lub linki phishingowe</li>
      <li>Gloryfikujących samobójstwa, samookaleczenia lub zaburzenia odżywiania</li>
    </ul>

    <h3>4.3 Prawa Autorskie</h3>
    <p>
      <strong>Twoje prawa:</strong> Zachowujesz pełne prawa autorskie do tworzonych treści.
    </p>
    <p>
      <strong>Licencja dla Serwisu:</strong> Publikując treści, udzielasz Serwisowi niewyłącznej, 
      bezpłatnej, nieograniczonej terytorialnie licencji na:
    </p>
    <ul>
      <li>Wyświetlanie, reprodukowanie i dystrybuowanie treści w Serwisie</li>
      <li>Tworzenie kopii zapasowych</li>
      <li>Promowanie treści w mediach społecznościowych i materiałach marketingowych</li>
      <li>Adaptację techniczną (formatowanie, kompresja obrazów)</li>
    </ul>
    <p>Licencja wygasa po usunięciu treści z Serwisu.</p>

    <h2>5. System Moderacji</h2>

    <h3>5.1 Proces Zatwierdzania</h3>
    <p>
      Wszystkie antystyki przechodzą przez proces moderacji przed publikacją:
    </p>
    <ul>
      <li><strong>Złożenie:</strong> Użytkownik przesyła antystyk</li>
      <li><strong>Kolejka moderacji:</strong> Antystyk trafia do przeglądu</li>
      <li><strong>Decyzja:</strong> Administrator zatwierdza lub odrzuca (z uzasadnieniem)</li>
      <li><strong>Publikacja:</strong> Zatwierdzone treści pojawiają się publicznie</li>
    </ul>

    <h3>5.2 Czas Moderacji</h3>
    <p>
      Staramy się zrealizować moderację w ciągu <strong>24-48 godzin</strong>. 
      W przypadku większego ruchu czas może się wydłużyć.
    </p>

    <h3>5.3 Zgłaszanie Treści</h3>
    <p>Użytkownicy mogą zgłaszać niewłaściwe treści. Każde zgłoszenie jest rozpatrywane indywidualnie.</p>

    <h2>6. Zasady Społeczności</h2>

    <h3>6.1 Kultura Dyskusji</h3>
    <p>Zachęcamy do:</p>
    <ul>
      <li>Konstruktywnej krytyki i merytorycznej dyskusji</li>
      <li>Szacunku dla różnych punktów widzenia</li>
      <li>Wskazywania na niuanse i "odcienie szarości"</li>
      <li>Weryfikowania źródeł przed publikacją</li>
    </ul>

    <h3>6.2 Zabronione Zachowania</h3>
    <ul>
      <li>Nękanie, stalking, groźby wobec innych użytkowników</li>
      <li>Personalne ataki (ad personam)</li>
      <li>Trolling, prowokacje, sabotowanie dyskusji</li>
      <li>Spamowanie, flooding</li>
      <li>Podszywanie się pod innych użytkowników lub instytucje</li>
      <li>Manipulowanie systemem polubień/zgłoszeń</li>
      <li>Próby obejścia systemów bezpieczeństwa</li>
    </ul>

    <h2>7. Własność Intelektualna</h2>

    <h3>7.1 Treści Serwisu</h3>
    <p>
      Wszystkie elementy Serwisu (logo, układ graficzny, kod źródłowy, nazwa, znaki towarowe) 
      są własnością Antystyki i podlegają ochronie prawnej.
    </p>

    <h3>7.2 Używanie Treści Serwisu</h3>
    <p>Dozwolone jest:</p>
    <ul>
      <li>Przeglądanie i korzystanie z Serwisu zgodnie z przeznaczeniem</li>
      <li>Udostępnianie linków do antystyków w mediach społecznościowych</li>
      <li>Cytowanie z podaniem źródła</li>
    </ul>
    <p>Zabronione jest:</p>
    <ul>
      <li>Kopiowanie kodu źródłowego Serwisu</li>
      <li>Scraping, masowe pobieranie treści</li>
      <li>Używanie logo/znaków towarowych bez zgody</li>
      <li>Tworzenie pochodnych serwisów bez licencji</li>
    </ul>

    <h2>8. Monetyzacja i Wsparcie</h2>

    <h3>8.1 Model Biznesowy</h3>
    <p>Serwis jest finansowany poprzez:</p>
    <ul>
      <li><strong>Reklamy:</strong> Etyczne reklamy displayowe (Google AdSense)</li>
      <li><strong>Wsparcie:</strong> Dobrowolne wpłaty przez "Buy Me a Coffee"</li>
      <li><strong>Sponsoring:</strong> Płatne treści od organizacji (z oznaczeniem)</li>
    </ul>

    <h3>8.2 Doświadczenie Bez Reklam</h3>
    <p>
      Użytkownicy wspierający Serwis poprzez "Buy Me a Coffee" otrzymują dostęp bez reklam 
      jako podziękowanie za wsparcie.
    </p>

    <h2>9. Odpowiedzialność i Wyłączenia</h2>

    <h3>9.1 Wyłączenie Odpowiedzialności za Treści</h3>
    <p>
      Serwis pełni rolę platformy udostępniającej treści tworzone przez użytkowników. 
      Nie ponosimy odpowiedzialności za:
    </p>
    <ul>
      <li>Dokładność i poprawność statystyk publikowanych przez użytkowników</li>
      <li>Szkody wynikające z użycia lub zaufania do opublikowanych treści</li>
      <li>Treści stron trzecich linkowanych w antystykach</li>
    </ul>

    <h3>9.2 Ograniczenie Odpowiedzialności</h3>
    <p>
      Serwis jest dostarczany "tak jak jest" (as-is). Nie gwarantujemy:
    </p>
    <ul>
      <li>Nieprzerwanego działania Serwisu</li>
      <li>Braku błędów lub luk w zabezpieczeniach</li>
      <li>Kompatybilności ze wszystkimi urządzeniami i przeglądarkami</li>
    </ul>

    <h3>9.3 Siła Wyższa</h3>
    <p>
      Nie ponosimy odpowiedzialności za niedostępność Serwisu spowodowaną siłą wyższą 
      (awarie serwerów, ataki DDoS, klęski żywiołowe, zmiany prawne).
    </p>

    <h2>10. Sankcje i Konsekwencje Naruszeń</h2>

    <h3>10.1 Możliwe Sankcje</h3>
    <p>W przypadku naruszenia Regulaminu możemy:</p>
    <ul>
      <li><strong>Ostrzeżenie:</strong> Pierwszorazowe drobne naruszenie</li>
      <li><strong>Usunięcie treści:</strong> Treści naruszające zasady są usuwane</li>
      <li><strong>Czasowa blokada:</strong> Zawieszenie konta na określony czas (7-30 dni)</li>
      <li><strong>Trwałe usunięcie konta:</strong> W przypadku poważnych lub powtarzających się naruszeń</li>
      <li><strong>Blokada IP:</strong> Przy próbach obejścia blokady lub automatyzacji</li>
    </ul>

    <h3>10.2 Odwołania</h3>
    <p>
      Możesz odwołać się od decyzji moderacyjnej wysyłając email na: 
      <strong>appeals@antystyki.pl</strong>
    </p>

    <h2>11. Zmiana i Zakończenie Usług</h2>

    <h3>11.1 Prawo do Zmian</h3>
    <p>
      Zastrzegamy sobie prawo do:
    </p>
    <ul>
      <li>Modyfikacji funkcjonalności Serwisu</li>
      <li>Zmiany Regulaminu (z 14-dniowym wyprzedzeniem dla istotnych zmian)</li>
      <li>Zaprzestania świadczenia Serwisu (z 30-dniowym wyprzedzeniem)</li>
    </ul>

    <h3>11.2 Usunięcie Konta</h3>
    <p>
      Możesz w każdej chwili usunąć swoje konto w ustawieniach. Dane osobowe zostaną 
      usunięte zgodnie z Polityką Prywatności.
    </p>

    <h2>12. Ochrona Danych Osobowych</h2>
    <p>
      Przetwarzanie danych osobowych odbywa się zgodnie z <strong>Polityką Prywatności</strong>, 
      która stanowi integralną część niniejszego Regulaminu.
    </p>
    <p>
      Podstawowe zasady:
    </p>
    <ul>
      <li>Przetwarzamy dane zgodnie z RODO/GDPR</li>
      <li>Zbieramy tylko niezbędne dane</li>
      <li>Masz prawo dostępu, sprostowania, usunięcia danych</li>
      <li>Dane są chronione odpowiednimi środkami technicznymi</li>
    </ul>

    <h2>13. Postanowienia Prawne</h2>

    <h3>13.1 Prawo Właściwe</h3>
    <p>
      Niniejszy Regulamin podlega prawu polskiemu. W przypadku sporu właściwy jest sąd 
      właściwy dla siedziby Administratora.
    </p>

    <h3>13.2 Konsumenci</h3>
    <p>
      Jeśli jesteś konsumentem w rozumieniu prawa polskiego, przysługują Ci dodatkowe prawa 
      wynikające z przepisów o ochronie konsumentów.
    </p>

    <h3>13.3 Rozstrzyganie Sporów</h3>
    <p>
      Zachęcamy do rozwiązywania sporów polubownie. Możesz skorzystać z platformy ODR 
      (Online Dispute Resolution): <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a>
    </p>

    <h3>13.4 Rozdzielność Postanowień</h3>
    <p>
      Jeśli jakiekolwiek postanowienie Regulaminu zostanie uznane za nieważne, pozostałe 
      postanowienia pozostają w mocy.
    </p>

    <h2>14. Kontakt</h2>
    <p>W sprawach związanych z Regulaminem:</p>
    <ul>
      <li><strong>Ogólne pytania:</strong> contact@antystyki.pl</li>
      <li><strong>Moderacja i zgłoszenia:</strong> moderation@antystyki.pl</li>
      <li><strong>Odwołania od decyzji:</strong> appeals@antystyki.pl</li>
      <li><strong>Ochrona danych:</strong> privacy@antystyki.pl</li>
      <li><strong>Zgłoszenia prawne (DMCA, naruszenia):</strong> legal@antystyki.pl</li>
    </ul>

    <h2>15. Postanowienia Końcowe</h2>
    <p>
      Korzystając z Serwisu, potwierdzasz, że:
    </p>
    <ul>
      <li>Przeczytałeś i zrozumiałeś niniejszy Regulamin</li>
      <li>Akceptujesz wszystkie postanowienia Regulaminu i Polityki Prywatności</li>
      <li>Zobowiązujesz się do przestrzegania zasad Serwisu</li>
      <li>Masz ukończone 16 lat lub zgodę opiekuna prawnego</li>
    </ul>

    <p className="text-sm text-gray-600 dark:text-gray-400 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
      <strong>Data wejścia w życie:</strong> 15 października 2025<br />
      <strong>Wersja:</strong> 1.0<br />
      <strong>Poprzednie wersje:</strong> Brak (pierwsza wersja)<br />
      <strong>Język wiążący:</strong> Polski (angielska wersja ma charakter pomocniczy)
    </p>
  </>
);

const EnglishTermsOfService = () => (
  <>
    <h2>1. General Provisions</h2>
    <p>
      These Terms of Service govern the use of the Antystyki platform (the "Service"), 
      operated at antystyki.pl. By using the Service, you accept these Terms in their entirety.
    </p>

    <h3>1.1 Definitions</h3>
    <ul>
      <li><strong>Service:</strong> The Antystyki web platform available at antystyki.pl</li>
      <li><strong>User:</strong> Person using the Service, both registered and unregistered</li>
      <li><strong>Antistic:</strong> Statistical content with intelligent, ironic interpretation</li>
      <li><strong>Account:</strong> Individual User profile in the Service</li>
      <li><strong>Administrator:</strong> Person managing the Service and moderating content</li>
    </ul>

    <h2>2. Service Mission and Goals</h2>
    <p className="font-semibold text-lg">
      "Antystyki turns real stats into witty gray-area stories that help our community think deeper before they share."
    </p>
    <p>
      Antystyki is an educational-humor platform that through intelligent interpretation 
      of statistics aims to:
    </p>
    <ul>
      <li>Reduce social polarization</li>
      <li>Promote critical thinking</li>
      <li>Show different perspectives of data interpretation</li>
      <li>Build a community that values witty nuance and thinks deeper before sharing</li>
    </ul>

    <h2>3. Registration and Account</h2>

    <h3>3.1 Registration Requirements</h3>
    <p>To create an account, you must:</p>
    <ul>
      <li>Be at least 16 years old (or have guardian consent)</li>
      <li>Provide a valid email address</li>
      <li>Choose a unique username</li>
      <li>Create a secure password (min. 8 characters)</li>
      <li>Verify email address via activation link</li>
      <li>Accept these Terms of Service and Privacy Policy</li>
    </ul>

    <h3>3.2 Account Security</h3>
    <p>User agrees to:</p>
    <ul>
      <li>Keep password confidential</li>
      <li>Immediately notify of unauthorized account access</li>
      <li>Use the Service in accordance with its purpose</li>
    </ul>

    <h3>3.3 Account Responsibility</h3>
    <p>
      User is fully responsible for all activities performed from their account.
    </p>

    <h2>4. Content Creation Rules</h2>

    <h3>4.1 Antistics Requirements</h3>
    <p>Each antistic must:</p>
    <ul>
      <li><strong>Be based on real data:</strong> Statistics must come from credible sources</li>
      <li><strong>Include source:</strong> Link or reference to data source is mandatory</li>
      <li><strong>Be original:</strong> Plagiarism and duplicates are prohibited</li>
      <li><strong>Have educational value:</strong> Content should provoke thought</li>
      <li><strong>Be aesthetic:</strong> Appropriate visual and linguistic quality</li>
    </ul>

    <h3>4.2 Prohibited Content</h3>
    <p>Publishing the following content is prohibited:</p>
    <ul>
      <li>Violating Polish or international law</li>
      <li>Infringing copyright or other intellectual property rights</li>
      <li>False, misleading, or disinformation</li>
      <li>Pornographic, obscene, or vulgar</li>
      <li>Promoting violence, racial, ethnic, or religious hatred</li>
      <li>Discriminating based on gender, sexual orientation, disability</li>
      <li>Offensive, defamatory, or violating privacy of third parties</li>
      <li>Spam, commercial advertising without Administrator consent</li>
      <li>Containing malware or phishing links</li>
      <li>Glorifying suicide, self-harm, or eating disorders</li>
    </ul>

    <h3>4.3 Copyright</h3>
    <p>
      <strong>Your rights:</strong> You retain full copyright to created content.
    </p>
    <p>
      <strong>License to Service:</strong> By publishing content, you grant the Service a non-exclusive, 
      royalty-free, worldwide license to:
    </p>
    <ul>
      <li>Display, reproduce, and distribute content in the Service</li>
      <li>Create backups</li>
      <li>Promote content on social media and marketing materials</li>
      <li>Technical adaptation (formatting, image compression)</li>
    </ul>
    <p>License expires after content removal from Service.</p>

    <h2>5. Moderation System</h2>

    <h3>5.1 Approval Process</h3>
    <p>
      All antistics go through moderation before publication:
    </p>
    <ul>
      <li><strong>Submission:</strong> User submits antistic</li>
      <li><strong>Moderation queue:</strong> Antistic goes to review</li>
      <li><strong>Decision:</strong> Administrator approves or rejects (with reason)</li>
      <li><strong>Publication:</strong> Approved content appears publicly</li>
    </ul>

    <h3>5.2 Moderation Time</h3>
    <p>
      We aim to complete moderation within <strong>24-48 hours</strong>. 
      During high traffic, time may be extended.
    </p>

    <h3>5.3 Reporting Content</h3>
    <p>Users can report inappropriate content. Each report is reviewed individually.</p>

    <h2>6. Community Guidelines</h2>

    <h3>6.1 Discussion Culture</h3>
    <p>We encourage:</p>
    <ul>
      <li>Constructive criticism and substantive discussion</li>
      <li>Respect for different viewpoints</li>
      <li>Pointing out witty gray-area insights</li>
      <li>Verifying sources before publication</li>
    </ul>

    <h3>6.2 Prohibited Behavior</h3>
    <ul>
      <li>Harassment, stalking, threats against other users</li>
      <li>Personal attacks (ad hominem)</li>
      <li>Trolling, provocations, sabotaging discussions</li>
      <li>Spamming, flooding</li>
      <li>Impersonating other users or institutions</li>
      <li>Manipulating likes/reports system</li>
      <li>Attempting to bypass security systems</li>
    </ul>

    <h2>7. Intellectual Property</h2>

    <h3>7.1 Service Content</h3>
    <p>
      All Service elements (logo, graphic layout, source code, name, trademarks) 
      are property of Antystyki and are legally protected.
    </p>

    <h3>7.2 Using Service Content</h3>
    <p>Allowed:</p>
    <ul>
      <li>Browsing and using Service as intended</li>
      <li>Sharing links to antistics on social media</li>
      <li>Quoting with attribution</li>
    </ul>
    <p>Prohibited:</p>
    <ul>
      <li>Copying Service source code</li>
      <li>Scraping, mass downloading content</li>
      <li>Using logo/trademarks without permission</li>
      <li>Creating derivative services without license</li>
    </ul>

    <h2>8. Monetization and Support</h2>

    <h3>8.1 Business Model</h3>
    <p>Service is funded through:</p>
    <ul>
      <li><strong>Advertising:</strong> Ethical display ads (Google AdSense)</li>
      <li><strong>Support:</strong> Voluntary contributions via "Buy Me a Coffee"</li>
      <li><strong>Sponsorship:</strong> Paid content from organizations (labeled)</li>
    </ul>

    <h3>8.2 Ad-Free Experience</h3>
    <p>
      Users supporting the Service through "Buy Me a Coffee" receive ad-free access 
      as a thank you for their support.
    </p>

    <h2>9. Liability and Disclaimers</h2>

    <h3>9.1 Disclaimer of Content Liability</h3>
    <p>
      Service acts as a platform providing user-generated content. 
      We are not responsible for:
    </p>
    <ul>
      <li>Accuracy and correctness of statistics published by users</li>
      <li>Damages resulting from use or reliance on published content</li>
      <li>Third-party content linked in antistics</li>
    </ul>

    <h3>9.2 Limitation of Liability</h3>
    <p>
      Service is provided "as-is". We do not guarantee:
    </p>
    <ul>
      <li>Uninterrupted Service operation</li>
      <li>Absence of errors or security vulnerabilities</li>
      <li>Compatibility with all devices and browsers</li>
    </ul>

    <h3>9.3 Force Majeure</h3>
    <p>
      We are not liable for Service unavailability caused by force majeure 
      (server failures, DDoS attacks, natural disasters, legal changes).
    </p>

    <h2>10. Sanctions and Consequences of Violations</h2>

    <h3>10.1 Possible Sanctions</h3>
    <p>In case of Terms violation, we may:</p>
    <ul>
      <li><strong>Warning:</strong> First-time minor violation</li>
      <li><strong>Content removal:</strong> Content violating rules is removed</li>
      <li><strong>Temporary ban:</strong> Account suspension for specified time (7-30 days)</li>
      <li><strong>Permanent account deletion:</strong> For serious or repeated violations</li>
      <li><strong>IP ban:</strong> When attempting to bypass ban or automation</li>
    </ul>

    <h3>10.2 Appeals</h3>
    <p>
      You can appeal moderation decisions by emailing: 
      <strong>appeals@antystyki.pl</strong>
    </p>

    <h2>11. Service Changes and Termination</h2>

    <h3>11.1 Right to Changes</h3>
    <p>
      We reserve the right to:
    </p>
    <ul>
      <li>Modify Service functionality</li>
      <li>Change Terms (with 14-day notice for significant changes)</li>
      <li>Discontinue Service (with 30-day notice)</li>
    </ul>

    <h3>11.2 Account Deletion</h3>
    <p>
      You can delete your account at any time in settings. Personal data will be 
      deleted according to Privacy Policy.
    </p>

    <h2>12. Personal Data Protection</h2>
    <p>
      Personal data processing is governed by the <strong>Privacy Policy</strong>, 
      which is an integral part of these Terms.
    </p>
    <p>
      Basic principles:
    </p>
    <ul>
      <li>We process data according to GDPR</li>
      <li>We collect only necessary data</li>
      <li>You have rights to access, rectification, deletion</li>
      <li>Data is protected by appropriate technical measures</li>
    </ul>

    <h2>13. Legal Provisions</h2>

    <h3>13.1 Applicable Law</h3>
    <p>
      These Terms are governed by Polish law. In case of dispute, the court with 
      jurisdiction over Administrator's seat applies.
    </p>

    <h3>13.2 Consumers</h3>
    <p>
      If you are a consumer under Polish law, you have additional rights under 
      consumer protection regulations.
    </p>

    <h3>13.3 Dispute Resolution</h3>
    <p>
      We encourage amicable dispute resolution. You can use the ODR platform 
      (Online Dispute Resolution): <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a>
    </p>

    <h3>13.4 Severability</h3>
    <p>
      If any provision of Terms is deemed invalid, remaining provisions remain in force.
    </p>

    <h2>14. Contact</h2>
    <p>For matters related to Terms:</p>
    <ul>
      <li><strong>General inquiries:</strong> contact@antystyki.pl</li>
      <li><strong>Moderation and reports:</strong> moderation@antystyki.pl</li>
      <li><strong>Appeals:</strong> appeals@antystyki.pl</li>
      <li><strong>Data protection:</strong> privacy@antystyki.pl</li>
      <li><strong>Legal reports (DMCA, violations):</strong> legal@antystyki.pl</li>
    </ul>

    <h2>15. Final Provisions</h2>
    <p>
      By using the Service, you confirm that:
    </p>
    <ul>
      <li>You have read and understood these Terms</li>
      <li>You accept all provisions of Terms and Privacy Policy</li>
      <li>You agree to comply with Service rules</li>
      <li>You are at least 16 years old or have guardian consent</li>
    </ul>

    <p className="text-sm text-gray-600 dark:text-gray-400 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
      <strong>Effective date:</strong> October 15, 2025<br />
      <strong>Version:</strong> 1.0<br />
      <strong>Previous versions:</strong> None (first version)<br />
      <strong>Binding language:</strong> Polish (English version is for reference)
    </p>
  </>
);

export default TermsOfService;

