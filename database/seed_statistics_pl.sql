-- Seed sample Statistics and Antystics derived from the first Perplexity batch (Nov 2025)
-- Run after core migrations and admin user creation (admin@antystyki.pl)

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
        RAISE EXCEPTION 'Admin user admin@antystyki.pl not found. Create the admin account before running seed_statistics_pl.sql.';
    END IF;

    -- Insert Antystics (humorous reinterpretations)
    INSERT INTO public."Antistics" (
        "Id", "Title", "ReversedStatistic", "SourceUrl", "ImageUrl",
        "BackgroundImageKey", "TemplateId", "ChartData", "Status",
        "RejectionReason", "LikesCount", "ViewsCount", "ReportsCount",
        "CommentsCount", "CreatedAt", "PublishedAt", "ModeratedAt",
        "HiddenAt", "HiddenByUserId", "UserId", "ModeratedByUserId"
    )
    VALUES
        (
            'd8e76374-061d-4a02-bdb5-79f91bf7c1a9',
            'Awokado zamiast chleba – czy to już koniec biedy?',
            'W Polsce skrajne ubóstwo spada, ale relatywne rośnie. Może niedługo biedni będą musieli wybierać między awokado a wifi?',
            'https://stat.gov.pl/obszary-tematyczne/warunki-zycia/ubostwo-pomoc-spoleczna/zasieg-zagrozenia-ubostwem-ekonomicznym-w-polsce-w-2024-r-,14,12.html',
            'https://dummyimage.com/1200x1200/1f2937/ffffff&text=Antystyki',
            NULL,
            'single-chart',
            jsonb_build_object(
                'templateId', 'single-chart',
                'singleChartData', jsonb_build_object(
                    'title', 'Skrajne vs relatywne ubóstwo',
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', 'Skrajne ubóstwo', 'percentage', 5.2, 'color', '#22c55e'),
                        jsonb_build_object('label', 'Relatywne ubóstwo', 'percentage', 13.3, 'color', '#f97316'),
                        jsonb_build_object('label', 'Pozostałe gospodarstwa', 'percentage', 81.5, 'color', '#6b7280')
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', 'Skrajne ubóstwo 5,2% vs relatywne 13,3%',
                    'context', 'Polska, GUS 2024'
                )
            )::text,
            1,
            NULL,
            33,
            122,
            0,
            0,
            timezone('utc', now()) - interval '9 days',
            timezone('utc', now()) - interval '8 days',
            timezone('utc', now()) - interval '8 days',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            'fbfb3a0d-028e-4260-9d55-a985cdcf37da',
            'Statystyczny Polak: Pół na pół cyfrowy, pół analogowy',
            'Niemal połowa Polaków zna się na cyfrowych trikach. Druga połowa wciąż czeka aż kserówka z memem się załaduje.',
            'https://stat.gov.pl/obszary-tematyczne/nauka-i-technika-spoleczenstwo-informacyjne/spoleczenstwo-informacyjne/spoleczenstwo-informacyjne-w-polsce-w-2024-roku,2,14.html',
            'https://dummyimage.com/1200x1200/111827/ffffff&text=Antystyki',
            NULL,
            'two-column-default',
            jsonb_build_object(
                'templateId', 'two-column-default',
                'perspectiveData', jsonb_build_object(
                    'mainPercentage', 48.8,
                    'mainLabel', 'Osoby z podstawowymi kompetencjami cyfrowymi',
                    'secondaryPercentage', 51.2,
                    'secondaryLabel', 'Reszta społeczeństwa',
                    'chartColor', '#3b82f6'
                ),
                'sourceData', jsonb_build_object(
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', 'Ma kompetencje cyfrowe', 'percentage', 48.8, 'color', '#6366f1'),
                        jsonb_build_object('label', 'Brak kompetencji cyfrowych', 'percentage', 51.2, 'color', '#f97316')
                    )
                )
            )::text,
            1,
            NULL,
            29,
            104,
            0,
            0,
            timezone('utc', now()) - interval '6 days',
            timezone('utc', now()) - interval '5 days',
            timezone('utc', now()) - interval '5 days',
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

    -- Insert Statistics (science-forward entries)
    INSERT INTO public."Statistics" (
        "Id", "Title", "Summary", "Description", "SourceUrl",
        "SourceCitation", "ChartData", "Status", "LikeCount",
        "DislikeCount", "TrustPoints", "FakePoints", "ViewsCount",
        "CreatedAt", "PublishedAt", "ModeratedAt", "CreatedByUserId",
        "ModeratedByUserId", "ConvertedAntisticId"
    )
    VALUES
        (
            '2fe9b280-9c2c-4a60-8d06-6d7d67f52c68',
            'Skrajne ubóstwo w Polsce spadło do 5,2% w 2024 roku',
            'W 2024 r. 5,2% osób w gospodarstwach domowych w Polsce zagrożonych było skrajnym ubóstwem, to o 1,4 p.p. mniej niż rok wcześniej.',
            'Spadek skrajnego ubóstwa pokazuje poprawę sytuacji materialnej, ale jednocześnie wzrosło ubóstwo relatywne oraz utrzymują się duże nierówności regionalne i pokoleniowe.',
            'https://stat.gov.pl/obszary-tematyczne/warunki-zycia/ubostwo-pomoc-spoleczna/zasieg-zagrozenia-ubostwem-ekonomicznym-w-polsce-w-2024-r-,14,12.html',
            'Główny Urząd Statystyczny, Zasięg zagrożenia ubóstwem ekonomicznym, 2025.',
            jsonb_build_object(
                'statisticId', 'stat-pl-001',
                'categorySlug', 'spoleczenstwo',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Gospodarstwa domowe, N~38 mln',
                'metricValue', 5.2,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'GUS, badanie ogólnopolskie',
                'trendNote', 'Spadek z 6,6% w 2023; relatywne ubóstwo wzrosło do 13,3%',
                'conversionHook', 'Czy spadek skrajnego ubóstwa oznacza, że Polacy mogą już jeść awokado na śniadanie?',
                'missionAlignmentNote', 'Pokazuje, jak dynamiczne są granice biedy i dlaczego jedna liczba nie wystarcza.',
                'confidenceScore', 0.97,
                'chartSuggestion', jsonb_build_object(
                    'type', 'bar',
                    'xAxisLabel', 'Rok',
                    'yAxisLabel', 'Odsetek ubóstwa skrajnego (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', '2023', 'value', 6.6),
                        jsonb_build_object('label', '2024', 'value', 5.2)
                    )
                )
            )::text,
            1,
            34,
            2,
            30,
            0,
            154,
            timezone('utc', now()) - interval '10 days',
            timezone('utc', now()) - interval '9 days',
            timezone('utc', now()) - interval '9 days',
            admin_id,
            admin_id,
            'd8e76374-061d-4a02-bdb5-79f91bf7c1a9'
        ),
        (
            'd873c892-9fb4-49a5-9c64-7b537e4b04fb',
            'Wydatki na zdrowie w Polsce wzrosły do 8,1% PKB',
            'W 2024 r. wydatki bieżące na ochronę zdrowia sięgnęły 293,6 mld zł – to już 8,1% PKB Polski.',
            'Wyższe wydatki nie zawsze oznaczają lepszą jakość usług. Część środków "pożerają" rosnące koszty i starzejąca się populacja. Wciąż rośnie też udział wydatków prywatnych.',
            'https://stat.gov.pl/obszary-tematyczne/zdrowie/zdrowie/wydatki-na-ochrone-zdrowia-w-latach-2022-2024,27,5.html',
            'GUS, Wydatki na ochronę zdrowia w latach 2022-2024, 2025.',
            jsonb_build_object(
                'statisticId', 'stat-pl-002',
                'categorySlug', 'zdrowie',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Budżet publiczny i gospodarstwa domowe',
                'metricValue', 8.1,
                'metricUnit', '% PKB',
                'sampleSizeOrSourceScope', 'GUS, Narodowy Rachunek Zdrowia',
                'trendNote', 'Wzrost z 7,2% PKB w 2023 roku',
                'conversionHook', 'Czy wydatki na zdrowie rosną szybciej niż liczba powtórzonych badań?',
                'missionAlignmentNote', 'Odkrywa kosztowe paradoksy zwiększania nakładów na zdrowie.',
                'confidenceScore', 0.95,
                'chartSuggestion', jsonb_build_object(
                    'type', 'line',
                    'xAxisLabel', 'Rok',
                    'yAxisLabel', 'Wydatki zdrowotne (% PKB)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', '2023', 'value', 7.2),
                        jsonb_build_object('label', '2024', 'value', 8.1)
                    )
                )
            )::text,
            1,
            31,
            1,
            26,
            0,
            112,
            timezone('utc', now()) - interval '7 days',
            timezone('utc', now()) - interval '6 days',
            timezone('utc', now()) - interval '6 days',
            admin_id,
            admin_id,
            NULL
        ),
        (
            '7a3bd517-8bde-4b4f-af1a-df245d5e9c8a',
            'Niemal 49% Polaków ma podstawowe umiejętności cyfrowe',
            'W 2024 r. 48,8% Polaków w wieku 16-74 posiadało podstawowe lub wyższe kompetencje cyfrowe.',
            'Choć wskaźnik rośnie, niemal połowa społeczeństwa pozostaje poza cyfrowym mainstreamem. Różnice generacyjne i wiejskie wyraźnie wpływają na poziom umiejętności.',
            'https://stat.gov.pl/obszary-tematyczne/nauka-i-technika-spoleczenstwo-informacyjne/spoleczenstwo-informacyjne/spoleczenstwo-informacyjne-w-polsce-w-2024-roku,2,14.html',
            'GUS, Społeczeństwo informacyjne w Polsce w 2024 roku.',
            jsonb_build_object(
                'statisticId', 'stat-pl-003',
                'categorySlug', 'technologia',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Osoby w wieku 16-74 lata',
                'metricValue', 48.8,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'GUS, N~12 000',
                'trendNote', 'Wzrost o 4,5 p.p. względem roku poprzedniego',
                'conversionHook', 'Czy umiejętność obsługi memów to już kompetencja cyfrowa?',
                'missionAlignmentNote', 'Podkreśla, że postęp technologiczny nie jest równomierny.',
                'confidenceScore', 0.93,
                'chartSuggestion', jsonb_build_object(
                    'type', 'pie',
                    'xAxisLabel', 'Kompetencje cyfrowe',
                    'yAxisLabel', 'Odsetek populacji (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', 'Tak', 'value', 48.8),
                        jsonb_build_object('label', 'Nie', 'value', 51.2)
                    )
                )
            )::text,
            1,
            22,
            0,
            21,
            0,
            92,
            timezone('utc', now()) - interval '5 days',
            timezone('utc', now()) - interval '4 days',
            timezone('utc', now()) - interval '4 days',
            admin_id,
            admin_id,
            'fbfb3a0d-028e-4260-9d55-a985cdcf37da'
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





