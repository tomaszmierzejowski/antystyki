-- Seed third batch of Statistics and Antystics (Perplexity batch 3, Nov 2025)
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
        RAISE EXCEPTION 'Admin user admin@antystyki.pl not found. Create the admin account before running seed_statistics_pl_batch3.sql.';
    END IF;

    -- Insert Antystics inspired by this batch of statistics
    INSERT INTO public."Antistics" (
        "Id", "Title", "ReversedStatistic", "SourceUrl", "ImageUrl",
        "BackgroundImageKey", "TemplateId", "ChartData", "Status",
        "RejectionReason", "LikesCount", "ViewsCount", "ReportsCount",
        "CommentsCount", "CreatedAt", "PublishedAt", "ModeratedAt",
        "HiddenAt", "HiddenByUserId", "UserId", "ModeratedByUserId"
    )
    VALUES
        (
            'dd87a0a8-5f3c-4f0e-91db-41c159a09c6a',
            'Matematyka: wróg numer jeden dla 27% polskich uczniów',
            'Co czwarty uczeń w Polsce woli memy niż liczenie, ale za to mamy filtr Snapchata na maturze.',
            'https://stat.gov.pl/obszary-tematyczne/edukacja/edukacja/edukacja-w-roku-szkolnym-20242025-wyniki-wstepne,21,3.html',
            'https://dummyimage.com/1200x1200/101827/ffffff&text=Antystyki',
            NULL,
            'two-column-default',
            jsonb_build_object(
                'templateId', 'two-column-default',
                'perspectiveData', jsonb_build_object(
                    'mainPercentage', 27,
                    'mainLabel', 'Uczniowie z trudnościami matematycznymi',
                    'secondaryPercentage', 73,
                    'secondaryLabel', 'Uczniowie radzący sobie z matematyką',
                    'chartColor', '#ef4444'
                ),
                'sourceData', jsonb_build_object(
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', 'Trudności', 'percentage', 27, 'color', '#f97316'),
                        jsonb_build_object('label', 'Bez trudności', 'percentage', 73, 'color', '#22c55e')
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', '27% uczniów deklaruje problemy z matematyką',
                    'context', 'GUS, szkoły podstawowe 2024'
                )
            )::text,
            1,
            NULL,
            22,
            90,
            0,
            0,
            timezone('utc', now()) - interval '30 hours',
            timezone('utc', now()) - interval '28 hours',
            timezone('utc', now()) - interval '28 hours',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            'f4d59c0b-5ff0-4a4a-b0f8-6497381fb8fa',
            'Wypalenie zawodowe: pracować aż do wypalenia, jak modem bez przerwy',
            '29% polskich pracowników działa na pełnym gazie, ale czy to sprint czy maraton bez mety?',
            'https://hrpolska.pl/raporty/2024-wypalenie-zawodowe',
            'https://dummyimage.com/1200x1200/0f172a/ffffff&text=Antystyki',
            NULL,
            'comparison',
            jsonb_build_object(
                'templateId', 'comparison',
                'comparisonData', jsonb_build_object(
                    'leftChart', jsonb_build_object(
                        'title', '2022',
                        'segments', jsonb_build_array(
                            jsonb_build_object('label', 'Wypaleni', 'percentage', 25, 'color', '#ef4444'),
                            jsonb_build_object('label', 'Reszta załogi', 'percentage', 75, 'color', '#6b7280')
                        )
                    ),
                    'rightChart', jsonb_build_object(
                        'title', '2024',
                        'segments', jsonb_build_array(
                            jsonb_build_object('label', 'Wypaleni', 'percentage', 29, 'color', '#f97316'),
                            jsonb_build_object('label', 'Reszta załogi', 'percentage', 71, 'color', '#22c55e')
                        )
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', '29% pracowników deklaruje wypalenie zawodowe',
                    'context', 'HR Polska 2024'
                )
            )::text,
            1,
            NULL,
            24,
            96,
            0,
            0,
            timezone('utc', now()) - interval '20 hours',
            timezone('utc', now()) - interval '18 hours',
            timezone('utc', now()) - interval '18 hours',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            '1f4ee188-3b62-4fa0-bcb5-691f0ef9b867',
            'Internet 40-letni? Portal dla pokolenia X i Z na wspólnej fali',
            'Średni wiek użytkownika internetu sięga 40 lat, co oznacza, że babcia i nastolatek mogą razem lajkować śmieszne koty.',
            'https://stat.gov.pl/obszary-tematyczne/nauka-i-technika-spoleczenstwo-informacyjne/spoleczenstwo-informacyjne/spoleczenstwo-informacyjne-w-polsce-w-2024-roku,2,14.html',
            'https://dummyimage.com/1200x1200/1f2937/ffffff&text=Antystyki',
            NULL,
            'single-chart',
            jsonb_build_object(
                'templateId', 'single-chart',
                'singleChartData', jsonb_build_object(
                    'title', 'Pokolenia online',
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', '18-29 lat', 'percentage', 32, 'color', '#3b82f6'),
                        jsonb_build_object('label', '30-44 lata', 'percentage', 35, 'color', '#8b5cf6'),
                        jsonb_build_object('label', '45-59 lat', 'percentage', 22, 'color', '#22c55e'),
                        jsonb_build_object('label', '60+ lat', 'percentage', 11, 'color', '#f97316')
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', 'Średni wiek użytkownika internetu w Polsce: 40 lat',
                    'context', 'GUS 2024'
                )
            )::text,
            1,
            NULL,
            21,
            85,
            0,
            0,
            timezone('utc', now()) - interval '12 hours',
            timezone('utc', now()) - interval '10 hours',
            timezone('utc', now()) - interval '10 hours',
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

    -- Insert Statistics aligned with the mission metadata
    INSERT INTO public."Statistics" (
        "Id", "Title", "Summary", "Description", "SourceUrl",
        "SourceCitation", "ChartData", "Status", "LikeCount",
        "DislikeCount", "TrustPoints", "FakePoints", "ViewsCount",
        "CreatedAt", "PublishedAt", "ModeratedAt", "CreatedByUserId",
        "ModeratedByUserId", "ConvertedAntisticId"
    )
    VALUES
        (
            '4e126ab9-2cf0-482d-b3a3-4fbe9bac10ab',
            'W 2024 r. 27% polskich uczniów miało trudności w nauce matematyki',
            'Ponad jedna czwarta uczniów szkół podstawowych w Polsce deklaruje problemy z matematyką, pomimo różnych reform edukacyjnych.',
            'Trudności w nauce matematyki dotyczą zwłaszcza uczniów z mniejszych miejscowości i z rodzin o niższym statusie społeczno-ekonomicznym, wskazując na nierówności w dostępie do jakości edukacji.',
            'https://stat.gov.pl/obszary-tematyczne/edukacja/edukacja/edukacja-w-roku-szkolnym-20242025-wyniki-wstepne,21,3.html',
            'GUS, Edukacja w roku szkolnym 2024/2025.',
            jsonb_build_object(
                'statisticId', 'stat-pl-007',
                'categorySlug', 'edukacja',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Uczniowie szkół podstawowych',
                'metricValue', 27,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'GUS, badanie ankietowe',
                'trendNote', 'Wzrost o 3 p.p. w ostatnich 3 latach',
                'conversionHook', 'Czy matematyka to w Polsce prawdziwy egzamin życia?',
                'missionAlignmentNote', 'Pokazuje nierówności edukacyjne i wyzwania systemowe.',
                'confidenceScore', 0.90,
                'chartSuggestion', jsonb_build_object(
                    'type', 'bar',
                    'xAxisLabel', 'Rok',
                    'yAxisLabel', 'Odsetek uczniów z trudnościami (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', '2021', 'value', 24),
                        jsonb_build_object('label', '2024', 'value', 27)
                    )
                )
            )::text,
            1,
            25,
            1,
            20,
            0,
            90,
            timezone('utc', now()) - interval '32 hours',
            timezone('utc', now()) - interval '30 hours',
            timezone('utc', now()) - interval '30 hours',
            admin_id,
            admin_id,
            'dd87a0a8-5f3c-4f0e-91db-41c159a09c6a'
        ),
        (
            'c61feeba-a908-4f9c-9bcf-9c44fd89a7d9',
            'Prawie 30% polskich pracowników czuje się wypalonych zawodowo w 2024 roku',
            'Wzrost zjawiska wypalenia zawodowego dotyczy 29% pracowników, najbardziej w branży IT i usług zdrowotnych.',
            'Problem wypalenia jest efektem rosnących oczekiwań, presji czasu i niewystarczającego wsparcia psychologicznego, co wpływa na efektywność i zdrowie pracowników.',
            'https://hrpolska.pl/raporty/2024-wypalenie-zawodowe',
            'HR Polska, Raport o wypaleniu zawodowym, 2024.',
            jsonb_build_object(
                'statisticId', 'stat-pl-008',
                'categorySlug', 'spoleczenstwo',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Pracownicy pełnoetatowi',
                'metricValue', 29,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'Raport HR, N≈10 000',
                'trendNote', 'Wzrost o 4 p.p. wobec 2022',
                'conversionHook', 'Czy wypalenie to nowa norma pracy w Polsce?',
                'missionAlignmentNote', 'Ukazuje społeczne konsekwencje zmieniającego się rynku pracy.',
                'confidenceScore', 0.88,
                'chartSuggestion', jsonb_build_object(
                    'type', 'line',
                    'xAxisLabel', 'Rok',
                    'yAxisLabel', 'Odsetek wypalonych zawodowo (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', '2022', 'value', 25),
                        jsonb_build_object('label', '2024', 'value', 29)
                    )
                )
            )::text,
            1,
            27,
            2,
            23,
            0,
            100,
            timezone('utc', now()) - interval '24 hours',
            timezone('utc', now()) - interval '22 hours',
            timezone('utc', now()) - interval '22 hours',
            admin_id,
            admin_id,
            'f4d59c0b-5ff0-4a4a-b0f8-6497381fb8fa'
        ),
        (
            'fa1d8d61-91d8-4558-b6d1-3d08d5c0d6f7',
            'W Polsce średnia wieku osób korzystających z internetu to 40 lat',
            'Przeciętny wiek użytkownika internetu w Polsce wynosi 40 lat, przy wzrastającej liczbie seniorów online.',
            'Internet coraz bardziej integruje pokolenia, ale różnice w sposobie korzystania i poziomie kompetencji cyfrowych są znaczące między młodymi a starszymi użytkownikami.',
            'https://stat.gov.pl/obszary-tematyczne/nauka-i-technika-spoleczenstwo-informacyjne/spoleczenstwo-informacyjne/spoleczenstwo-informacyjne-w-polsce-w-2024-roku,2,14.html',
            'GUS, Społeczeństwo informacyjne w Polsce, 2024.',
            jsonb_build_object(
                'statisticId', 'stat-pl-009',
                'categorySlug', 'technologia',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Użytkownicy internetu, wszystkie grupy wiekowe',
                'metricValue', 40,
                'metricUnit', 'lata',
                'sampleSizeOrSourceScope', 'GUS, badanie społeczne',
                'trendNote', 'Wzrost średniej wieku z 37 lat w 2020 do 40 lat w 2024',
                'conversionHook', 'Czy internet zmienia się tak samo jak jego użytkownicy?',
                'missionAlignmentNote', 'Pokazuje ewolucję cyfrowego społeczeństwa.',
                'confidenceScore', 0.90,
                'chartSuggestion', jsonb_build_object(
                    'type', 'line',
                    'xAxisLabel', 'Rok',
                    'yAxisLabel', 'Średni wiek użytkownika (lata)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', '2020', 'value', 37),
                        jsonb_build_object('label', '2024', 'value', 40)
                    )
                )
            )::text,
            1,
            26,
            0,
            21,
            0,
            108,
            timezone('utc', now()) - interval '16 hours',
            timezone('utc', now()) - interval '14 hours',
            timezone('utc', now()) - interval '14 hours',
            admin_id,
            admin_id,
            '1f4ee188-3b62-4fa0-bcb5-691f0ef9b867'
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


