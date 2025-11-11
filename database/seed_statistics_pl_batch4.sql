-- Seed fourth batch of Statistics and Antystics (Perplexity batch 4, Nov 2025)
-- Requires admin account admin@antystyki.pl and completed migrations

DO $$
DECLARE
    admin_id uuid;
BEGIN
    SELECT "Id"
    INTO admin_id
    FROM public."AspNetUsers"
    WHERE lower("Email") = 'admin@antystyki.pl'
    LIMIT 1;

    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Admin user admin@antystyki.pl not found. Create the admin account before running seed_statistics_pl_batch4.sql.';
    END IF;

    -- Insert Antystics derived from this batch
    INSERT INTO public."Antistics" (
        "Id", "Title", "ReversedStatistic", "SourceUrl", "ImageUrl",
        "BackgroundImageKey", "TemplateId", "ChartData", "Status",
        "RejectionReason", "LikesCount", "ViewsCount", "ReportsCount",
        "CommentsCount", "CreatedAt", "PublishedAt", "ModeratedAt",
        "HiddenAt", "HiddenByUserId", "UserId", "ModeratedByUserId"
    )
    VALUES
        (
            '7ac6f13a-b1a0-4d01-a5e4-1f0d4ee0d55a',
            'Polityk zaufania szuka, nie znalazł',
            'Dla 81% Polaków polityk jest bardziej memem niż autorytetem. Być może politykom został tylko TikTok – tu i tak nikt nie wierzy.',
            'https://www.cbos.pl/SPISKOM.POL/2024/K_030_24.PDF',
            'https://dummyimage.com/1200x1200/0b1120/ffffff&text=Antystyki',
            NULL,
            'single-chart',
            jsonb_build_object(
                'templateId', 'single-chart',
                'singleChartData', jsonb_build_object(
                    'title', 'Zaufanie do polityków',
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', 'Ufa', 'percentage', 19, 'color', '#22c55e'),
                        jsonb_build_object('label', 'Nie ufa', 'percentage', 81, 'color', '#ef4444')
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', '81% Polaków nie ufa politykom',
                    'context', 'CBOS 2024'
                )
            )::text,
            1,
            NULL,
            62,
            310,
            0,
            0,
            timezone('utc', now()) - interval '8 hours',
            timezone('utc', now()) - interval '7 hours 30 minutes',
            timezone('utc', now()) - interval '7 hours 30 minutes',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            'db8f94f5-07f7-4b37-b0e5-6c980b9d7d02',
            'Pogoda nieważna, fake news zawsze świeci',
            'Co ósmy Polak sprawdza fake newsy częściej niż prognozę pogody. Czekamy na alerty o burzach clickbaitów.',
            'https://www.kantar.com/pl/raport-fake-news-2025',
            'https://dummyimage.com/1200x1200/111827/ffffff&text=Antystyki',
            NULL,
            'comparison',
            jsonb_build_object(
                'templateId', 'comparison',
                'comparisonData', jsonb_build_object(
                    'leftChart', jsonb_build_object(
                        'title', '2023',
                        'segments', jsonb_build_array(
                            jsonb_build_object('label', 'Fake news > pogoda', 'percentage', 9, 'color', '#f97316'),
                            jsonb_build_object('label', 'Prognoza wygrywa', 'percentage', 91, 'color', '#60a5fa')
                        )
                    ),
                    'rightChart', jsonb_build_object(
                        'title', '2025',
                        'segments', jsonb_build_array(
                            jsonb_build_object('label', 'Fake news > pogoda', 'percentage', 12, 'color', '#ef4444'),
                            jsonb_build_object('label', 'Prognoza wygrywa', 'percentage', 88, 'color', '#38bdf8')
                        )
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', '12% Polaków częściej trafia na fake newsy niż prognozę pogody',
                    'context', 'Kantar 2025'
                )
            )::text,
            1,
            NULL,
            45,
            187,
            0,
            0,
            timezone('utc', now()) - interval '6 hours',
            timezone('utc', now()) - interval '5 hours 30 minutes',
            timezone('utc', now()) - interval '5 hours 30 minutes',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            '6ef7de48-b45a-4fa7-9acc-39f1c57a97d1',
            'Memy czy PLN – wybór trudniejszy niż wybory',
            '31% Polaków woli szczęście z memów, a inflacja przestaje być tematem, bo śmieszny obrazek wystarczy na pocieszenie.',
            'https://panel.antystyki.pl/raport-memy-2025',
            'https://dummyimage.com/1200x1200/1f2937/ffffff&text=Antystyki',
            NULL,
            'single-chart',
            jsonb_build_object(
                'templateId', 'single-chart',
                'singleChartData', jsonb_build_object(
                    'title', 'Źródła szczęścia 2025',
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', 'Memy', 'percentage', 31, 'color', '#a855f7'),
                        jsonb_build_object('label', 'Wynagrodzenie', 'percentage', 20, 'color', '#34d399'),
                        jsonb_build_object('label', 'Inne', 'percentage', 49, 'color', '#64748b')
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', '31% młodych dorosłych wskazuje memy jako główne źródło szczęścia',
                    'context', 'Panel Antystyki 2025'
                )
            )::text,
            1,
            NULL,
            52,
            260,
            0,
            0,
            timezone('utc', now()) - interval '4 hours',
            timezone('utc', now()) - interval '3 hours 30 minutes',
            timezone('utc', now()) - interval '3 hours 30 minutes',
            NULL,
            NULL,
            admin_id,
            admin_id
        )
    ON CONFLICT ("Id") DO UPDATE SET
        "Title" = EXCLUDED."Title",
        "ReversedStatistic" = EXCLUDED."ReversedStatistic",
        "SourceUrl" = EXCLUDED."SourceUrl",
        "ImageUrl" = EXCLUDED."ImageUrl",
        "TemplateId" = EXCLUDED."TemplateId",
        "ChartData" = EXCLUDED."ChartData",
        "Status" = EXCLUDED."Status",
        "LikesCount" = EXCLUDED."LikesCount",
        "ViewsCount" = EXCLUDED."ViewsCount",
        "CommentsCount" = EXCLUDED."CommentsCount",
        "ReportsCount" = EXCLUDED."ReportsCount",
        "ModeratedAt" = EXCLUDED."ModeratedAt",
        "PublishedAt" = EXCLUDED."PublishedAt",
        "UserId" = EXCLUDED."UserId",
        "ModeratedByUserId" = EXCLUDED."ModeratedByUserId";

    -- Insert Statistics (mission-aligned data entries)
    INSERT INTO public."Statistics" (
        "Id", "Title", "Summary", "Description", "SourceUrl",
        "SourceCitation", "ChartData", "Status", "LikeCount",
        "DislikeCount", "TrustPoints", "FakePoints", "ViewsCount",
        "CreatedAt", "PublishedAt", "ModeratedAt", "CreatedByUserId",
        "ModeratedByUserId", "ConvertedAntisticId"
    )
    VALUES
        (
            '1ea9097a-9f5a-4c2d-9d07-8fd6a6bfa58c',
            'Tylko 19% Polaków ufa politykom. Rekord Europy?',
            'Zaufanie do polityków w Polsce sięgnęło dna — zaledwie 19% deklaruje, że im ufa.',
            'W 2024 polska nieufność polityczna osiągnęła nowy szczyt cynizmu. To jeden z najniższych wskaźników w UE, choć partyjne narracje przekonują, że „społeczeństwo ufa bardziej niż sądzi”.',
            'https://www.cbos.pl/SPISKOM.POL/2024/K_030_24.PDF',
            'CBOS, Komunikat o zaufaniu społecznym, 2024.',
            jsonb_build_object(
                'statisticId', 'stat-pl-010',
                'categorySlug', 'polityka',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Dorośli, N=1 100',
                'metricValue', 19,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'CBOS, badanie reprezentatywne',
                'trendNote', 'Spadek z 21% w 2023, mimo dużej ekspozycji medialnej polityków',
                'conversionHook', 'Czy statystyka zdradza, że Polak polityka zobaczy tylko na memie?',
                'missionAlignmentNote', 'Obnaża ironię wiary w autorytety i wpływ autopromocji.',
                'moderationNote', 'Sensitive: polityka — wymagana czujna moderacja',
                'confidenceScore', 0.88,
                'chartSuggestion', jsonb_build_object(
                    'type', 'pie',
                    'xAxisLabel', 'Postawa',
                    'yAxisLabel', 'Odsetek respondentów (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', 'Ufa', 'value', 19),
                        jsonb_build_object('label', 'Nie ufa', 'value', 81)
                    )
                )
            )::text,
            1,
            54,
            7,
            11,
            2,
            327,
            timezone('utc', now()) - interval '9 hours',
            timezone('utc', now()) - interval '8 hours',
            timezone('utc', now()) - interval '8 hours',
            admin_id,
            admin_id,
            '7ac6f13a-b1a0-4d01-a5e4-1f0d4ee0d55a'
        ),
        (
            'ebcf993d-910c-4ed3-9d19-85ef1b3a95ad',
            '12% polskich respondentów śledzi fake newsy częściej niż serwisy pogodowe',
            'Co ósmy Polak twierdzi, że częściej trafia na fake newsy niż na prognozę pogody.',
            'W badaniach 2025 r. Polacy wskazali, że natężenie dezinformacji online wzrosło. Rosnąca liczba fałszywych newsów została oficjalnie uznana za większe zagrożenie niż zła aura.',
            'https://www.kantar.com/pl/raport-fake-news-2025',
            'Kantar, Raport na temat fake news, 2025.',
            jsonb_build_object(
                'statisticId', 'stat-pl-011',
                'categorySlug', 'spoleczenstwo',
                'geography', 'Polska',
                'year', 2025,
                'populationScope', 'Dorośli korzystający z internetu, N≈1 800',
                'metricValue', 12,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'Kantar, badanie online',
                'trendNote', 'Wzrost z 9% w 2023 — większa świadomość manipulacji cyfrowej',
                'conversionHook', 'Czy fake newsy robią karierę na polskich smartfonach?',
                'missionAlignmentNote', 'Podkreśla granicę percepcji realnych i sztucznych zagrożeń.',
                'moderationNote', 'Sensitive: dezinformacja — wymaga dodatkowej weryfikacji',
                'confidenceScore', 0.85,
                'chartSuggestion', jsonb_build_object(
                    'type', 'bar',
                    'xAxisLabel', 'Rok',
                    'yAxisLabel', 'Fake news > prognoza (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', '2023', 'value', 9),
                        jsonb_build_object('label', '2025', 'value', 12)
                    )
                )
            )::text,
            1,
            43,
            5,
            15,
            3,
            160,
            timezone('utc', now()) - interval '7 hours',
            timezone('utc', now()) - interval '6 hours',
            timezone('utc', now()) - interval '6 hours',
            admin_id,
            admin_id,
            'db8f94f5-07f7-4b37-b0e5-6c980b9d7d02'
        ),
        (
            'b3b88d5d-ef9d-4e65-b9d3-6a3e1d620dd5',
            'Ponad 30% Polaków uważa, że szczęście zależy od memów (nie od zarobków)',
            '31% ankietowanych czuje się szczęśliwsza dzięki memom, a nie wzrostowi wynagrodzenia.',
            'W 2025 roku memy przebiły inflację w walce o dobre samopoczucie. Pokolenie Z deklaruje wyższy wpływ śmiesznych obrazków na szczęście niż rosnąca pensja.',
            'https://panel.antystyki.pl/raport-memy-2025',
            'Antystyki, Panel testowy emocji online, 2025.',
            jsonb_build_object(
                'statisticId', 'stat-pl-012',
                'categorySlug', 'spoleczenstwo',
                'topicTag', 'metahumor',
                'geography', 'Polska',
                'year', 2025,
                'populationScope', 'Dorośli 18-35, panel Antystyki',
                'metricValue', 31,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'Badanie własne Antystyki, N=900',
                'trendNote', 'Nowe pytanie — dalszy trend do określenia',
                'conversionHook', 'Czy świat ratowany jest przez śmiech, nie przez przelewy?',
                'missionAlignmentNote', 'Prowokuje do pytań o wartość cyfrowej kultury.',
                'confidenceScore', 0.70,
                'chartSuggestion', jsonb_build_object(
                    'type', 'pie',
                    'xAxisLabel', 'Źródło szczęścia',
                    'yAxisLabel', 'Odsetek (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', 'Memy', 'value', 31),
                        jsonb_build_object('label', 'Wynagrodzenie', 'value', 20),
                        jsonb_build_object('label', 'Inne', 'value', 49)
                    )
                )
            )::text,
            1,
            74,
            9,
            8,
            1,
            340,
            timezone('utc', now()) - interval '5 hours',
            timezone('utc', now()) - interval '4 hours',
            timezone('utc', now()) - interval '4 hours',
            admin_id,
            admin_id,
            '6ef7de48-b45a-4fa7-9acc-39f1c57a97d1'
        ),
        (
            '4c3ab0a2-2778-4a25-a7d2-3a4ee3c7b8ef',
            '41% studentów myśli o emigracji dla wyższej pensji i memów bez cenzury',
            'Coraz więcej młodych Polaków łączy marzenie o zarobkach z „wolnością memiczną” — aż 41% planuje wyjazd za granicę.',
            'Migracja młodych napędzana jest nie tylko ekonomicznie – istotny jest też swobodny dostęp do kultury internetowej i mniejsza presja światopoglądowa.',
            'https://www.big.pl/raport/edukacja-emigracja-2025',
            'BIG InfoMonitor, Raport Studencki, 2025.',
            jsonb_build_object(
                'statisticId', 'stat-pl-013',
                'categorySlug', 'edukacja',
                'geography', 'Polska',
                'year', 2025,
                'populationScope', 'Studenci szkół wyższych, N=4 300',
                'metricValue', 41,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'BIG InfoMonitor, badanie ogólnopolskie',
                'trendNote', 'Wzrost z 35% w 2022 — rośnie waga cyfrowej swobody',
                'conversionHook', 'Czy „memiczna swoboda” to nowy filar wolności akademickiej?',
                'missionAlignmentNote', 'Łączy trendy rynku pracy z realiami online.',
                'confidenceScore', 0.81,
                'chartSuggestion', jsonb_build_object(
                    'type', 'bar',
                    'xAxisLabel', 'Rok',
                    'yAxisLabel', 'Deklaracje emigracyjne (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', '2022', 'value', 35),
                        jsonb_build_object('label', '2025', 'value', 41)
                    )
                )
            )::text,
            1,
            57,
            6,
            16,
            2,
            215,
            timezone('utc', now()) - interval '3 hours',
            timezone('utc', now()) - interval '2 hours 30 minutes',
            timezone('utc', now()) - interval '2 hours 30 minutes',
            admin_id,
            admin_id,
            NULL
        ),
        (
            '0f5c2f32-8a9c-4a91-96eb-4703a3e7092a',
            'Aż 65% Polaków boi się o swoje dane w internecie, ale tylko 13% działa',
            'Powszechne obawy cyberbezpieczeństwa nie przekładają się na realne zabezpieczenia.',
            'Paradoks internetowego strachu: większość Polaków deklaruje lęk o wyciek danych, podczas gdy realnie tylko 1 na 8 aktywnie korzysta np. z menedżera haseł.',
            'https://digitalpoland.org/raport-cyberbezpieczenstwo-2025.html',
            'Digital Poland, Raport cyberbezpieczeństwo 2025.',
            jsonb_build_object(
                'statisticId', 'stat-pl-014',
                'categorySlug', 'bezpieczenstwo',
                'geography', 'Polska',
                'year', 2025,
                'populationScope', 'Dorośli korzystający z internetu',
                'metricValue', 65,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'Digital Poland, badanie 2024/25',
                'trendNote', 'Rok do roku wzrost strachu (62% → 65%), brak postępu w zabezpieczeniach',
                'conversionHook', 'Czy polski strach przed siecią to tylko viralowa moda?',
                'missionAlignmentNote', 'Pokazuje różnicę między deklaracją a codziennością.',
                'confidenceScore', 0.86,
                'chartSuggestion', jsonb_build_object(
                    'type', 'bar',
                    'xAxisLabel', 'Zachowanie/Obawa',
                    'yAxisLabel', 'Procent (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', 'Boi się', 'value', 65),
                        jsonb_build_object('label', 'Działa', 'value', 13)
                    )
                )
            )::text,
            1,
            38,
            2,
            19,
            1,
            162,
            timezone('utc', now()) - interval '2 hours',
            timezone('utc', now()) - interval '90 minutes',
            timezone('utc', now()) - interval '90 minutes',
            admin_id,
            admin_id,
            NULL
        )
    ON CONFLICT ("Id") DO UPDATE SET
        "Title" = EXCLUDED."Title",
        "Summary" = EXCLUDED."Summary",
        "Description" = EXCLUDED."Description",
        "SourceUrl" = EXCLUDED."SourceUrl",
        "SourceCitation" = EXCLUDED."SourceCitation",
        "ChartData" = EXCLUDED."ChartData",
        "Status" = EXCLUDED."Status",
        "LikeCount" = EXCLUDED."LikeCount",
        "DislikeCount" = EXCLUDED."DislikeCount",
        "TrustPoints" = EXCLUDED."TrustPoints",
        "FakePoints" = EXCLUDED."FakePoints",
        "ViewsCount" = EXCLUDED."ViewsCount",
        "PublishedAt" = EXCLUDED."PublishedAt",
        "ModeratedAt" = EXCLUDED."ModeratedAt",
        "CreatedByUserId" = EXCLUDED."CreatedByUserId",
        "ModeratedByUserId" = EXCLUDED."ModeratedByUserId",
        "ConvertedAntisticId" = EXCLUDED."ConvertedAntisticId";
END $$;


