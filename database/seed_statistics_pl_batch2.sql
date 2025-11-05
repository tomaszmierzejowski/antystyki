-- Seed second batch of Statistics and Antystics (Perplexity batch 2, Nov 2025)
-- Requires admin account admin@antystyki.pl and prior migrations

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
        RAISE EXCEPTION 'Admin user admin@antystyki.pl not found. Create the admin account before running seed_statistics_pl_batch2.sql.';
    END IF;

    -- Insert Antystics derived from statistics in this batch
    INSERT INTO public."Antistics" (
        "Id", "Title", "ReversedStatistic", "SourceUrl", "ImageUrl",
        "BackgroundImageKey", "TemplateId", "ChartData", "Status",
        "RejectionReason", "LikesCount", "ViewsCount", "ReportsCount",
        "CommentsCount", "CreatedAt", "PublishedAt", "ModeratedAt",
        "HiddenAt", "HiddenByUserId", "UserId", "ModeratedByUserId"
    )
    VALUES
        (
            '5b398f44-e995-4c05-8e5c-5dff1ae0f4cb',
            'Drogowy raj czy media-aleja tragedii?',
            'Wypadki spadają, a my dalej boimy się jeździć. Może winne są telewizory, nie drogi?',
            'https://stat.gov.pl/obszary-tematyczne/bezpieczenstwo/',
            'https://dummyimage.com/1200x1200/0f172a/ffffff&text=Antystyki',
            NULL,
            'comparison',
            jsonb_build_object(
                'templateId', 'comparison',
                'comparisonData', jsonb_build_object(
                    'leftChart', jsonb_build_object(
                        'title', '2014',
                        'segments', jsonb_build_array(
                            jsonb_build_object('label', 'Ciężkie wypadki', 'percentage', 100, 'color', '#ef4444'),
                            jsonb_build_object('label', 'Cel wizji zero', 'percentage', 0, 'color', '#22c55e')
                        )
                    ),
                    'rightChart', jsonb_build_object(
                        'title', '2024',
                        'segments', jsonb_build_array(
                            jsonb_build_object('label', 'Ciężkie wypadki', 'percentage', 65, 'color', '#f97316'),
                            jsonb_build_object('label', 'Cel wizji zero', 'percentage', 35, 'color', '#22c55e')
                        )
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', 'Spadek poważnych wypadków drogowych o 35% w dekadę',
                    'context', 'KRBRD, Polska 2014-2024'
                )
            )::text,
            1,
            NULL,
            31,
            105,
            0,
            0,
            timezone('utc', now()) - interval '4 days',
            timezone('utc', now()) - interval '3 days',
            timezone('utc', now()) - interval '3 days',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            'de5f31a0-1b20-4e0e-9c85-313d5dc40872',
            'Sztuczna inteligencja? Polska czeka na aktualizacje',
            'Podczas gdy UE ogarnia AI, polskie firmy dalej szukają "Ctrl+Alt+Del" na tradycyjnych komputerach.',
            'https://www.trade.gov.pl/aktualnosci/sztuczna-inteligencja-w-unii-europejskiej-liderzy-i-outsiderzy/',
            'https://dummyimage.com/1200x1200/1e293b/ffffff&text=Antystyki',
            NULL,
            'two-column-default',
            jsonb_build_object(
                'templateId', 'two-column-default',
                'perspectiveData', jsonb_build_object(
                    'mainPercentage', 30,
                    'mainLabel', 'Polskie firmy z AI',
                    'secondaryPercentage', 70,
                    'secondaryLabel', 'Firmy bez AI',
                    'chartColor', '#3b82f6'
                ),
                'sourceData', jsonb_build_object(
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', 'Polska 2024', 'percentage', 30, 'color', '#6366f1'),
                        jsonb_build_object('label', 'Średnia UE 2024', 'percentage', 60, 'color', '#f97316'),
                        jsonb_build_object('label', 'Pozostała luka', 'percentage', 10, 'color', '#6b7280')
                    )
                )
            )::text,
            1,
            NULL,
            28,
            100,
            0,
            0,
            timezone('utc', now()) - interval '2 days',
            timezone('utc', now()) - interval '36 hours',
            timezone('utc', now()) - interval '36 hours',
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

    -- Insert Statistics (science-led entries with mission metadata)
    INSERT INTO public."Statistics" (
        "Id", "Title", "Summary", "Description", "SourceUrl",
        "SourceCitation", "ChartData", "Status", "LikeCount",
        "DislikeCount", "TrustPoints", "FakePoints", "ViewsCount",
        "CreatedAt", "PublishedAt", "ModeratedAt", "CreatedByUserId",
        "ModeratedByUserId", "ConvertedAntisticId"
    )
    VALUES
        (
            '2aaf8d8a-1f5a-44eb-9d53-2f58434f66b4',
            'Liczba ciężkich wypadków na polskich drogach spadła o 35% w 10 lat',
            'Między 2014 a 2024 rokiem liczba ciężkich wypadków drogowych w Polsce spadła o 35%, choć odczucia społeczne są przeciwne.',
            'Pomimo znacznego spadku liczby ciężkich wypadków, większość Polaków uważa, że drogi są coraz bardziej niebezpieczne. To zjawisko wynika z większej medialności pojedynczych tragedii oraz wzrostu liczby pojazdów na drogach.',
            'https://stat.gov.pl/obszary-tematyczne/bezpieczenstwo/',
            'KRBRD, Raport o stanie bezpieczeństwa ruchu drogowego, 2025.',
            jsonb_build_object(
                'statisticId', 'stat-pl-004',
                'categorySlug', 'bezpieczenstwo',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Wypadki drogowe zarejestrowane przez policję',
                'metricValue', 65.0,
                'metricUnit', '% względem 2014',
                'sampleSizeOrSourceScope', 'KRBRD, dane statystyczne',
                'trendNote', 'Spadek z indeksu 100 w 2014 do 65 w 2024',
                'conversionHook', 'Czy kosztowne kampanie i lepsze drogi zmieniają postrzeganie ryzyka?',
                'missionAlignmentNote', 'Pokazuje rozbieżność między statystykami a percepcją bezpieczeństwa.',
                'confidenceScore', 0.96,
                'chartSuggestion', jsonb_build_object(
                    'type', 'line',
                    'xAxisLabel', 'Rok',
                    'yAxisLabel', 'Ciężkie wypadki (% 2014)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', '2014', 'value', 100),
                        jsonb_build_object('label', '2024', 'value', 65)
                    )
                )
            )::text,
            1,
            40,
            3,
            35,
            0,
            180,
            timezone('utc', now()) - interval '5 days',
            timezone('utc', now()) - interval '4 days',
            timezone('utc', now()) - interval '4 days',
            admin_id,
            admin_id,
            '5b398f44-e995-4c05-8e5c-5dff1ae0f4cb'
        ),
        (
            '1189f50a-569a-4f59-8f06-3b1b8d98d346',
            'W 2024 roku 18% Polaków zadeklarowało chroniczne problemy ze snem',
            'Prawie co piąty dorosły Polak w 2024 r. deklaruje chroniczne problemy ze snem, co wpływa na zdrowie i efektywność pracy.',
            'Choć świadomość zdrowia wzrasta, problemy ze snem są mocno niedoceniane i często bagatelizowane. Ich skutki przejawiają się w wyższej absencji chorobowej i pogorszeniu stanu psychicznego.',
            'https://ocdn.eu/medonet/medonet/Raport%20Narodowy%20Test%20Zdrowia%20Polak%C3%B3w%202024.pdf',
            'Narodowy Test Zdrowia Polaków, 2024.',
            jsonb_build_object(
                'statisticId', 'stat-pl-005',
                'categorySlug', 'zdrowie',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Dorośli 18+, N≈5 000',
                'metricValue', 18,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'Narodowy Test Zdrowia Polaków',
                'trendNote', 'Wzrost z 16% w 2022 do 18% w 2024',
                'conversionHook', 'Czy zdrowy sen to luksus XXI wieku?',
                'missionAlignmentNote', 'Wywołuje refleksję nad paradoksem dbania o zdrowie.',
                'confidenceScore', 0.90,
                'chartSuggestion', jsonb_build_object(
                    'type', 'bar',
                    'xAxisLabel', 'Rok',
                    'yAxisLabel', 'Problemy ze snem (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', '2022', 'value', 16),
                        jsonb_build_object('label', '2024', 'value', 18)
                    )
                )
            )::text,
            1,
            29,
            1,
            25,
            0,
            120,
            timezone('utc', now()) - interval '3 days',
            timezone('utc', now()) - interval '2 days',
            timezone('utc', now()) - interval '2 days',
            admin_id,
            admin_id,
            NULL
        ),
        (
            'd66df5ce-8f34-4c0f-bbfd-968d0b7f5ee5',
            'W Polsce tylko 30% firm korzysta z zaawansowanych technologii AI',
            'Podczas gdy 60% firm w UE korzysta z AI, w Polsce jest to zaledwie 30%, co oznacza zaległości w transformacji cyfrowej.',
            'Niska adaptacja AI wynika z barier edukacyjnych, finansowych oraz obaw przed utratą pracy. Jednocześnie firmy, które wdrożyły AI, wskazują na wzrost efektywności i konkurencyjności.',
            'https://www.trade.gov.pl/aktualnosci/sztuczna-inteligencja-w-unii-europejskiej-liderzy-i-outsiderzy/',
            'Eurostat, Sztuczna inteligencja w UE, 2024.',
            jsonb_build_object(
                'statisticId', 'stat-pl-006',
                'categorySlug', 'technologia',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Przedsiębiorstwa średnie i duże',
                'metricValue', 30,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'Eurostat 2024',
                'trendNote', 'Wzrost z 20% w 2022, nadal poniżej średniej UE (60%)',
                'conversionHook', 'Czy Polska nadrobi dystans czy zostanie w tyle?',
                'missionAlignmentNote', 'Pokazuje jak postęp technologiczny dzieli przedsiębiorstwa i kraje.',
                'confidenceScore', 0.92,
                'chartSuggestion', jsonb_build_object(
                    'type', 'bar',
                    'xAxisLabel', 'Rok',
                    'yAxisLabel', 'Firmy używające AI (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', '2022', 'value', 20),
                        jsonb_build_object('label', '2024', 'value', 30)
                    )
                )
            )::text,
            1,
            27,
            2,
            23,
            0,
            115,
            timezone('utc', now()) - interval '2 days',
            timezone('utc', now()) - interval '36 hours',
            timezone('utc', now()) - interval '36 hours',
            admin_id,
            admin_id,
            'de5f31a0-1b20-4e0e-9c85-313d5dc40872'
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


