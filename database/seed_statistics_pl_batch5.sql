-- Seed fifth batch of Statistics and Antystics (Perplexity batch 5, Nov 2025)
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
        RAISE EXCEPTION 'Admin user admin@antystyki.pl not found. Create the admin account before running seed_statistics_pl_batch5.sql.';
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
            'e5c57cfe-f5f0-4671-9e6b-0b6a4ef3b7db',
            'Zdalna praca: największy blef XXI wieku',
            '15,7% pracuje zdalnie, reszta udaje, że pracuje – ale gdzieś tam, gdzie są biurka i szefowie.',
            'https://businessinsider.com.pl/biznes/praca/tyle-polakow-pracuje-zdalnie-gus-podal-dane/d8pxhm2',
            'https://dummyimage.com/1200x1200/111827/ffffff&text=Antystyki',
            NULL,
            'comparison',
            jsonb_build_object(
                'templateId', 'comparison',
                'comparisonData', jsonb_build_object(
                    'leftChart', jsonb_build_object(
                        'title', 'Deklaracje',
                        'segments', jsonb_build_array(
                            jsonb_build_object('label', 'Zdalna', 'percentage', 15.7, 'color', '#22c55e'),
                            jsonb_build_object('label', 'Hybrydowa', 'percentage', 20.0, 'color', '#f97316'),
                            jsonb_build_object('label', 'Stacjonarna', 'percentage', 64.3, 'color', '#64748b')
                        )
                    ),
                    'rightChart', jsonb_build_object(
                        'title', 'Narracja medialna',
                        'segments', jsonb_build_array(
                            jsonb_build_object('label', 'Zdalna hype', 'percentage', 50, 'color', '#38bdf8'),
                            jsonb_build_object('label', 'Reszta rzeczywistości', 'percentage', 50, 'color', '#a855f7')
                        )
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', '15,7% Polaków realnie pracuje zdalnie',
                    'context', 'GUS II kw. 2024'
                )
            )::text,
            1,
            NULL,
            34,
            112,
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
            '96c87f09-cc8f-4f7f-af26-7ba16c8cf530',
            'Zarabiaj memami, postaw dom z lajków',
            'Influencerzy zarabiają od 1K do 100K za post, czyli tym bardziej warto było rzucić uniwersytet.',
            'https://tuinwestuje.pl/ile-zarabia-influencer/',
            'https://dummyimage.com/1200x1200/1e293b/ffffff&text=Antystyki',
            NULL,
            'single-chart',
            jsonb_build_object(
                'templateId', 'single-chart',
                'singleChartData', jsonb_build_object(
                    'title', 'Zarobki influencerów (PLN/post)',
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', 'Nano', 'percentage', 2, 'value', 500, 'color', '#fde047'),
                        jsonb_build_object('label', 'Mikro', 'percentage', 6, 'value', 3000, 'color', '#f97316'),
                        jsonb_build_object('label', 'Makro', 'percentage', 40, 'value', 20000, 'color', '#38bdf8'),
                        jsonb_build_object('label', 'Mega', 'percentage', 52, 'value', 100000, 'color', '#8b5cf6')
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', 'Polscy influencerzy inkasują 1K–100K PLN za post',
                    'context', 'Fashion Biznes / Tuinwestuje 2025'
                )
            )::text,
            1,
            NULL,
            55,
            234,
            0,
            0,
            timezone('utc', now()) - interval '4 hours',
            timezone('utc', now()) - interval '3 hours 30 minutes',
            timezone('utc', now()) - interval '3 hours 30 minutes',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            '9f1f014e-d562-4b78-8e48-f5efbc07195d',
            'Depresja – choroba dla odważnych',
            '72% uważa depresję za wstydliwą, czyli że być chorym to być słabym – logika polska na najwyższym poziomie.',
            'https://wsip.sggw.pl/raport-z-badania-postawy-polakow-wobec-depresji/',
            'https://dummyimage.com/1200x1200/0f172a/ffffff&text=Antystyki',
            NULL,
            'single-chart',
            jsonb_build_object(
                'templateId', 'single-chart',
                'singleChartData', jsonb_build_object(
                    'title', 'Stosunek do depresji',
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', 'Wstyd', 'percentage', 72, 'color', '#ef4444'),
                        jsonb_build_object('label', 'Akceptacja', 'percentage', 28, 'color', '#22c55e')
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', '72% Polaków uważa depresję za wstydliwą',
                    'context', 'CBOS 2024'
                )
            )::text,
            1,
            NULL,
            38,
            145,
            0,
            0,
            timezone('utc', now()) - interval '3 hours',
            timezone('utc', now()) - interval '2 hours 30 minutes',
            timezone('utc', now()) - interval '2 hours 30 minutes',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            '65391a01-eeb0-4b1f-bb0a-b9847d50eafa',
            'Facet nie idzie do lekarza – facet umiera w domu',
            'Mężczyźni żyją 9 lat krócej i się z tego dumają, bo \"żaden mężczyzna nie umiera ze strachu\".',
            'https://biznes.newseria.pl/kobiety-czesciej-choruja-ale-mezczyzni-zywaja-krocej,',
            'https://dummyimage.com/1200x1200/1f2937/ffffff&text=Antystyki',
            NULL,
            'comparison',
            jsonb_build_object(
                'templateId', 'comparison',
                'comparisonData', jsonb_build_object(
                    'leftChart', jsonb_build_object(
                        'title', 'Polska',
                        'segments', jsonb_build_array(
                            jsonb_build_object('label', 'Kobiety', 'percentage', 50, 'value', 82, 'color', '#f472b6'),
                            jsonb_build_object('label', 'Mężczyźni', 'percentage', 50, 'value', 73, 'color', '#60a5fa')
                        )
                    ),
                    'rightChart', jsonb_build_object(
                        'title', 'UE średnio',
                        'segments', jsonb_build_array(
                            jsonb_build_object('label', 'Kobiety', 'percentage', 50, 'value', 83, 'color', '#f472b6'),
                            jsonb_build_object('label', 'Mężczyźni', 'percentage', 50, 'value', 78, 'color', '#60a5fa')
                        )
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', 'Polscy mężczyźni żyją średnio o 9 lat krócej niż kobiety',
                    'context', 'NIPH / Siemens 2024'
                )
            )::text,
            1,
            NULL,
            48,
            201,
            0,
            0,
            timezone('utc', now()) - interval '2 hours',
            timezone('utc', now()) - interval '90 minutes',
            timezone('utc', now()) - interval '90 minutes',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            '42a3107c-db20-4df3-9323-1d6c8a55932b',
            'Pokolenie Y znalazło babysittera: to się zwie smartfonem',
            '38% 5-latków ma smartfona, czyli równowaga między nauką a TikTokiem jest zagwarantowana.',
            'https://wiadomosci.onet.pl/tylko-w-onecie/coraz-mlodsze-dzieci-przed-ekranami-juz-co-czwarte-w-wieku-do-5-lat-uzywa-smartfona-lub-tabletu/02m6xfm',
            'https://dummyimage.com/1200x1200/101827/ffffff&text=Antystyki',
            NULL,
            'two-column-default',
            jsonb_build_object(
                'templateId', 'two-column-default',
                'perspectiveData', jsonb_build_object(
                    'mainPercentage', 38,
                    'mainLabel', '0-5 lat korzysta z urządzeń cyfrowych',
                    'secondaryPercentage', 62,
                    'secondaryLabel', 'Jeszcze offline',
                    'chartColor', '#22c55e'
                ),
                'sourceData', jsonb_build_object(
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', '0-5 lat', 'percentage', 38, 'color', '#38bdf8'),
                        jsonb_build_object('label', '5-7 lat', 'percentage', 84, 'color', '#f97316'),
                        jsonb_build_object('label', '8-11 lat', 'percentage', 96, 'color', '#8b5cf6'),
                        jsonb_build_object('label', '12-17 lat', 'percentage', 99, 'color', '#64748b')
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', 'Cyfrowe dzieciństwo zaczyna się przed 5. rokiem życia',
                    'context', 'CBOS 2024'
                )
            )::text,
            1,
            NULL,
            44,
            178,
            0,
            0,
            timezone('utc', now()) - interval '80 minutes',
            timezone('utc', now()) - interval '70 minutes',
            timezone('utc', now()) - interval '70 minutes',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            '90994b9e-6a5f-4c0c-9a92-7d9fc7644580',
            'Netflix Rule: polska kultura to już seria bez końca',
            '50% polskiego streamingu to Netflix – czyli jedyna rzecz, którą Polacy mają wspólnie, to prawo do tego samego binge-watchingu.',
            'https://inwestycje.pl/netflix-pozostaje-liderem-svod-w-polsce-z-32-udzialu-w-polskim-rynku-streamingu-online-q4-2024/',
            'https://dummyimage.com/1200x1200/0b1120/ffffff&text=Antystyki',
            NULL,
            'single-chart',
            jsonb_build_object(
                'templateId', 'single-chart',
                'singleChartData', jsonb_build_object(
                    'title', 'Udział platform streamingowych',
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', 'Netflix', 'percentage', 50, 'color', '#ef4444'),
                        jsonb_build_object('label', 'Max', 'percentage', 16, 'color', '#22c55e'),
                        jsonb_build_object('label', 'Disney+', 'percentage', 12, 'color', '#38bdf8'),
                        jsonb_build_object('label', 'Inne', 'percentage', 22, 'color', '#64748b')
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', 'Netflix odpowiada za 50% streamingu w Polsce',
                    'context', 'JustWatch Q4 2024'
                )
            )::text,
            1,
            NULL,
            51,
            216,
            0,
            0,
            timezone('utc', now()) - interval '50 minutes',
            timezone('utc', now()) - interval '40 minutes',
            timezone('utc', now()) - interval '40 minutes',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            '7b12f4a1-8b02-4680-8c72-b9d9810c40ee',
            'Za 4 godziny dziennie online urośnie cyfrowy Polak',
            'Nastolatki spędzają 4 godziny dziennie przed ekranem, czyli więcej niż to, co polskie szkoły robią kiedyś w dzień.',
            'https://wiadomosci.onet.pl/tylko-w-onecie/coraz-mlodsze-dzieci-przed-ekranami-juz-co-czwarte-w-wieku-do-5-lat-uzywa-smartfona-lub-tabletu/02m6xfm',
            'https://dummyimage.com/1200x1200/1e293b/ffffff&text=Antystyki',
            NULL,
            'two-column-default',
            jsonb_build_object(
                'templateId', 'two-column-default',
                'perspectiveData', jsonb_build_object(
                    'mainPercentage', 100,
                    'mainLabel', 'Średnio 4 godziny dziennie online (12-17 lat)',
                    'secondaryPercentage', 0,
                    'secondaryLabel', 'Offline',
                    'chartColor', '#f97316'
                ),
                'sourceData', jsonb_build_object(
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', 'Czas online 2020', 'percentage', 75, 'color', '#38bdf8'),
                        jsonb_build_object('label', 'Czas online 2024', 'percentage', 100, 'color', '#ef4444')
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', 'Starsza młodzież spędza 4h dziennie przed ekranem',
                    'context', 'CBOS 2024'
                )
            )::text,
            1,
            NULL,
            46,
            167,
            0,
            0,
            timezone('utc', now()) - interval '35 minutes',
            timezone('utc', now()) - interval '30 minutes',
            timezone('utc', now()) - interval '30 minutes',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            '5a809b18-864b-46be-9aad-1b2b9d2e441d',
            'Hybrydowy paradoks: 20% pracy + 80% szpecenia',
            'Praca hybrydowa rośnie, czyli biuro czeka na Ciebie 2-3 dni, żeby Ci powiedzieć to, co już wiesz z mejli.',
            'https://businessinsider.com.pl/biznes/praca/tyle-polakow-pracuje-zdalnie-gus-podal-dane/d8pxhm2',
            'https://dummyimage.com/1200x1200/0f172a/ffffff&text=Antystyki',
            NULL,
            'two-column-default',
            jsonb_build_object(
                'templateId', 'two-column-default',
                'perspectiveData', jsonb_build_object(
                    'mainPercentage', 20,
                    'mainLabel', 'Praca hybrydowa',
                    'secondaryPercentage', 80,
                    'secondaryLabel', 'Reszta modeli',
                    'chartColor', '#38bdf8'
                ),
                'sourceData', jsonb_build_object(
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', 'Zdalna', 'percentage', 15.7, 'color', '#22c55e'),
                        jsonb_build_object('label', 'Hybrydowa', 'percentage', 20.0, 'color', '#38bdf8'),
                        jsonb_build_object('label', 'Stacjonarna', 'percentage', 64.3, 'color', '#64748b')
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', 'Hybryda zajmuje 20% rynku pracy',
                    'context', 'GUS II kw. 2024'
                )
            )::text,
            1,
            NULL,
            39,
            134,
            0,
            0,
            timezone('utc', now()) - interval '25 minutes',
            timezone('utc', now()) - interval '20 minutes',
            timezone('utc', now()) - interval '20 minutes',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            'ef3fd6c9-9c77-40be-8045-7cc54d1005c4',
            'Influencer to nowy zawód, studia to stary papier',
            'Influencerzy zarabiają 25K średnio, a kierownik średniego szczebla – 12K, czyli bingo dla TikToka.',
            'https://tuinwestuje.pl/ile-zarabia-influencer/',
            'https://dummyimage.com/1200x1200/111827/ffffff&text=Antystyki',
            NULL,
            'two-column-default',
            jsonb_build_object(
                'templateId', 'two-column-default',
                'perspectiveData', jsonb_build_object(
                    'mainPercentage', 25,
                    'mainLabel', 'Mediana zarobku influencera (tys. PLN)',
                    'secondaryPercentage', 12,
                    'secondaryLabel', 'Średni menedżer (tys. PLN)',
                    'chartColor', '#f97316'
                ),
                'sourceData', jsonb_build_object(
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', 'Influencer', 'percentage', 25, 'color', '#f97316'),
                        jsonb_build_object('label', 'Kierownik', 'percentage', 12, 'color', '#22c55e'),
                        jsonb_build_object('label', 'Specjalista', 'percentage', 8, 'color', '#38bdf8')
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', 'Influencer > kierownik średniego szczebla (zarobki)',
                    'context', 'Fashion Biznes 2025'
                )
            )::text,
            1,
            NULL,
            61,
            289,
            0,
            0,
            timezone('utc', now()) - interval '15 minutes',
            timezone('utc', now()) - interval '12 minutes',
            timezone('utc', now()) - interval '12 minutes',
            NULL,
            NULL,
            admin_id,
            admin_id
        ),
        (
            'd44b407d-6bf8-40d7-9fdc-85e07c547f87',
            'Polacy wiedzą, że depresja boli, ale wolą jej nie widzieć',
            '80% Polaków nie szuka pomocy, bo wstydu więcej niż bólu, a psychiatra = słabość na papierze.',
            'https://wsip.sggw.pl/raport-z-badania-postawy-polakow-wobec-depresji/',
            'https://dummyimage.com/1200x1200/1f2937/ffffff&text=Antystyki',
            NULL,
            'single-chart',
            jsonb_build_object(
                'templateId', 'single-chart',
                'singleChartData', jsonb_build_object(
                    'title', 'Szukanie pomocy przy depresji',
                    'segments', jsonb_build_array(
                        jsonb_build_object('label', 'Nie szuka pomocy', 'percentage', 80, 'color', '#ef4444'),
                        jsonb_build_object('label', 'Szukają wsparcia', 'percentage', 20, 'color', '#22c55e')
                    )
                ),
                'textData', jsonb_build_object(
                    'mainStatistic', '80% osób z depresją w Polsce nie prosi o pomoc',
                    'context', 'CBOS 2024'
                )
            )::text,
            1,
            NULL,
            35,
            128,
            0,
            0,
            timezone('utc', now()) - interval '10 minutes',
            timezone('utc', now()) - interval '8 minutes',
            timezone('utc', now()) - interval '8 minutes',
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
            '6b9c8d57-1e5c-4624-82d3-1cc583e85437',
            'Zdalna praca w Polsce to fikcja dla 70% pracowników',
            'Zaledwie 15,7% polskich pracowników pracuje zdalnie zwykle lub czasami, podczas gdy 30% deklaruje, że pracuje \"nie wiadomo jak\".',
            'Pomimo hałasu wokół zdalnej pracy, rzeczywistość polska to głównie biura pełne osób. Luka między medialnymi obietnicami o elastyczności a rzeczywistością rynku pracy wskazuje na wciąż konserwatywne podejście firm.',
            'https://businessinsider.com.pl/biznes/praca/tyle-polakow-pracuje-zdalnie-gus-podal-dane/d8pxhm2',
            'GUS, Społeczeństwo informacyjne 2024; Business Insider Polska, 2024.',
            jsonb_build_object(
                'statisticId', 'stat-pl-015',
                'categorySlug', 'economy',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Pracownicy pełnoetatowi, N≈15 mln',
                'metricValue', 15.7,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'GUS, II kw. 2024',
                'trendNote', 'Model hybrydowy rośnie szybciej niż zdalny; spadek ofert w Q1 2025',
                'conversionHook', 'Czy praca zdalna to moda czy rzeczywistość?',
                'missionAlignmentNote', 'Ukazuje grę między PR-em a realiami rynku pracy.',
                'confidenceScore', 0.92,
                'chartSuggestion', jsonb_build_object(
                    'type', 'bar',
                    'xAxisLabel', 'Typ pracy',
                    'yAxisLabel', 'Odsetek pracowników (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', 'Zdalna', 'value', 15.7),
                        jsonb_build_object('label', 'Hybrydowa', 'value', 20.0),
                        jsonb_build_object('label', 'Stacjonarna', 'value', 64.3)
                    )
                )
            )::text,
            1,
            32,
            4,
            27,
            1,
            145,
            timezone('utc', now()) - interval '6 hours 30 minutes',
            timezone('utc', now()) - interval '6 hours',
            timezone('utc', now()) - interval '6 hours',
            admin_id,
            admin_id,
            'e5c57cfe-f5f0-4671-9e6b-0b6a4ef3b7db'
        ),
        (
            '3c27a3a1-81ab-40c3-86c1-8baa0a5d20e8',
            'Polacy zarabiają na memach: influencerzy zarabiają od 1K do 100K PLN za post',
            'Zarobki polskich influencerów na TikTok, YouTube i Instagramie wahają się od kilku tysięcy do kilkudziesięciu tysięcy złotych za pojedynczy post.',
            'Kariera influencera stała się realną opcją zarobkową. Jednak dysproporcja między mega-influencerami a nowicjuszami jest ogromna. Netflix influencerów bije jak gotówka — czasami więcej niż pracownicy tradycyjnego sektora.',
            'https://tuinwestuje.pl/ile-zarabia-influencer/',
            'Tuinwestuje.pl; Fashion Biznes, Ile zarabia influencer?, 2025.',
            jsonb_build_object(
                'statisticId', 'stat-pl-016',
                'categorySlug', 'spoleczenstwo',
                'topicTag', 'metahumor',
                'geography', 'Polska',
                'year', 2025,
                'populationScope', 'Zawodowi influencerzy',
                'metricValue', 25000,
                'metricUnit', 'PLN',
                'sampleSizeOrSourceScope', 'Raporty branżowe 2024/25',
                'trendNote', 'Rynek influencerów rośnie ~20% rocznie; widełki od 1K do 100K PLN/post',
                'conversionHook', 'Czy memy to nowa waluta społeczeństwa?',
                'missionAlignmentNote', 'Pokazuje, jak cyfrowa kultura tworzy nowe pola ekonomiczne.',
                'confidenceScore', 0.85,
                'chartSuggestion', jsonb_build_object(
                    'type', 'bar',
                    'xAxisLabel', 'Typ influencera',
                    'yAxisLabel', 'Mediana zarobku (PLN)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', 'Nano', 'value', 500),
                        jsonb_build_object('label', 'Mikro', 'value', 3000),
                        jsonb_build_object('label', 'Makro', 'value', 20000),
                        jsonb_build_object('label', 'Mega', 'value', 100000)
                    )
                )
            )::text,
            1,
            68,
            5,
            18,
            2,
            312,
            timezone('utc', now()) - interval '4 hours 30 minutes',
            timezone('utc', now()) - interval '4 hours',
            timezone('utc', now()) - interval '4 hours',
            admin_id,
            admin_id,
            '96c87f09-cc8f-4f7f-af26-7ba16c8cf530'
        ),
        (
            'f2d50a75-8c43-4766-9dc7-f8a08e6f7ad4',
            'Depresja w Polsce: co 10. Polak cierpi, ale 72% się jej wstydzi',
            'Około 4 milionów Polaków choruje na depresję, ale zdecydowana większość postrzega ją jako chorobę wstydliwą.',
            'Statystycznym paradoksem: Polacy rozpoznają depresję jako poważną chorobę, ale równocześnie wierzą, że „pozytywne myślenie ją wyleczy”. Niski odsetek ludzi szukających pomocy wynika z zakorzenionego wstydu i barier systemowych.',
            'https://wsip.sggw.pl/raport-z-badania-postawy-polakow-wobec-depresji/',
            'CBOS / SGGW, Postawy Polaków wobec depresji, 2024.',
            jsonb_build_object(
                'statisticId', 'stat-pl-017',
                'categorySlug', 'zdrowie',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Dorośli mieszkańcy Polski, N≈1000+',
                'metricValue', 72,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'CBOS, badanie ogólnopolskie',
                'trendNote', 'Wstyd wobec depresji utrzymuje się na podobnym poziomie od lat; 80% nie szuka pomocy',
                'conversionHook', 'Czy depresja powinna być trendem, żeby ją zaakceptować?',
                'missionAlignmentNote', 'Ukazuje przepaść między wiedzą a przyjęciem społecznym choroby.',
                'moderationNote', 'Sensitive: zdrowie psychiczne – wymaga empatycznej moderacji',
                'confidenceScore', 0.91,
                'chartSuggestion', jsonb_build_object(
                    'type', 'pie',
                    'xAxisLabel', 'Postawa',
                    'yAxisLabel', 'Procent respondentów (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', 'Postrzega wstyd', 'value', 72),
                        jsonb_build_object('label', 'Brak wstydu', 'value', 28)
                    )
                )
            )::text,
            1,
            41,
            3,
            33,
            0,
            187,
            timezone('utc', now()) - interval '3 hours 30 minutes',
            timezone('utc', now()) - interval '3 hours',
            timezone('utc', now()) - interval '3 hours',
            admin_id,
            admin_id,
            '9f1f014e-d562-4b78-8e48-f5efbc07195d'
        ),
        (
            'a702992f-7ea5-4003-b255-399fc92f81a2',
            'Mężczyźni żyją 9 lat krócej niż kobiety, ale się tym nie przejmują',
            'Statystyczny Polak żyje średnio o 9 lat krócej niż Polka, głównie z powodu wypadków, palenia i niechęci do lekarza.',
            'Polska ma wciąż głębokie korzenie „męskiego twardziela”. Mężczyźni rzadko szukają pomocy medycznej, więcej palą i piją, a stereotyp nie pozwala im przyznać słabości. Rezultat: wdowiec zamiast pary.',
            'https://biznes.newseria.pl/kobiety-czesciej-choruja-ale-mezczyzni-zywaja-krocej,',
            'Newseria / NIPH, Raport zdrowotny 2024.',
            jsonb_build_object(
                'statisticId', 'stat-pl-018',
                'categorySlug', 'zdrowie',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Dorośli mieszkańcy Polski',
                'metricValue', 9,
                'metricUnit', 'lata',
                'sampleSizeOrSourceScope', 'NIPH, dane demograficzne 2024',
                'trendNote', 'Luka płci pogłębia się – w UE to średnio 5 lat',
                'conversionHook', 'Czy stereotyp „twardego faceta” wart jest 9 lat życia?',
                'missionAlignmentNote', 'Pokazuje, jak społeczne normy wpływają na zdrowotne wyniki.',
                'moderationNote', 'Sensitive: płeć/stereotypy – wymaga czułej moderacji',
                'confidenceScore', 0.89,
                'chartSuggestion', jsonb_build_object(
                    'type', 'bar',
                    'xAxisLabel', 'Region',
                    'yAxisLabel', 'Różnica oczekiwanej długości życia (lata)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', 'Polska', 'value', 9),
                        jsonb_build_object('label', 'UE średnia', 'value', 5),
                        jsonb_build_object('label', 'Skandynawia', 'value', 3)
                    )
                )
            )::text,
            1,
            52,
            6,
            29,
            1,
            223,
            timezone('utc', now()) - interval '2 hours 30 minutes',
            timezone('utc', now()) - interval '2 hours',
            timezone('utc', now()) - interval '2 hours',
            admin_id,
            admin_id,
            '65391a01-eeb0-4b1f-bb0a-b9847d50eafa'
        ),
        (
            'db8144cb-68ab-4a45-94d6-5d38cc58abf7',
            'Dzieci poniżej 5 lat już (38%) czują się komfortowo ze smartfonem',
            '38% dzieci poniżej pięciu lat już korzysta z urządzeń cyfrowych, a najstarsza młodzież spędza 4 godziny dziennie online.',
            'Polska cyfrowa niepokojącym tempem wciąga najmłodszych. Smartfon to nowy smoczek. Czas spędzany rośnie o 17 minut rocznie, a dzieci z gorszych domów zaczynają jeszcze wcześniej — nie ze strachu przed przyszłością, lecz z braku alternatywy.',
            'https://wiadomosci.onet.pl/tylko-w-onecie/coraz-mlodsze-dzieci-przed-ekranami-juz-co-czwarte-w-wieku-do-5-lat-uzywa-smartfona-lub-tabletu/02m6xfm',
            'CBOS, Dzieci i urządzenia cyfrowe, 2024.',
            jsonb_build_object(
                'statisticId', 'stat-pl-019',
                'categorySlug', 'technologia',
                'geography', 'Polska',
                'year', 2024,
                'populationScope', 'Dzieci 0-17 lat, badanie CBOS',
                'metricValue', 38,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'CBOS, 2024',
                'trendNote', 'Wzrost z 25% w 2020; czas dzienny rośnie z 45 do 60 min',
                'conversionHook', 'Czy smartfon to rachunek za babysitting w przyszłości?',
                'missionAlignmentNote', 'Ukazuje nowy standard dzieciństwa i jego szare obszary.',
                'confidenceScore', 0.93,
                'chartSuggestion', jsonb_build_object(
                    'type', 'line',
                    'xAxisLabel', 'Wiek dziecka (lata)',
                    'yAxisLabel', 'Procent korzystających (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', '0-5', 'value', 38),
                        jsonb_build_object('label', '5-7', 'value', 84),
                        jsonb_build_object('label', '8-11', 'value', 96),
                        jsonb_build_object('label', '12-17', 'value', 99)
                    )
                )
            )::text,
            1,
            58,
            7,
            32,
            2,
            267,
            timezone('utc', now()) - interval '80 minutes',
            timezone('utc', now()) - interval '70 minutes',
            timezone('utc', now()) - interval '70 minutes',
            admin_id,
            admin_id,
            '42a3107c-db20-4df3-9323-1d6c8a55932b'
        ),
        (
            'f6c4d2d4-fc9c-4df9-ad08-91042e3e3f7a',
            'Netflix czyli 50% polskiego streamingu, czyli połowa naszego czasu online',
            'Netflix to 50% wszystkich wyświetleń streamingowych w Polsce, 32,6% użytkowników każdego miesiąca.',
            'Polska zatrzymała się na jednej platformie. Disney+, Max i Amazon walczą o okruchy, ale Netflix dominuje jak niezachwiany imperator. Średnio 5 godzin i 32 minuty miesięcznie spędzamy na Netfliksie.',
            'https://inwestycje.pl/netflix-pozostaje-liderem-svod-w-polsce-z-32-udzialu-w-polskim-rynku-streamingu-online-q4-2024/',
            'JustWatch, Netflix liderem streamingu w Polsce, 2025.',
            jsonb_build_object(
                'statisticId', 'stat-pl-020',
                'categorySlug', 'spoleczenstwo',
                'topicTag', 'metahumor',
                'geography', 'Polska',
                'year', 2025,
                'populationScope', 'Użytkownicy streamingu VOD',
                'metricValue', 50,
                'metricUnit', '%',
                'sampleSizeOrSourceScope', 'JustWatch Q4 2024',
                'trendNote', 'Netflix spadł z 52% do 50%; Max zyskuje udział',
                'conversionHook', 'Czy polska kultura to już 50% Netflix + 50% sprawa prywatna?',
                'missionAlignmentNote', 'Pokazuje monopol cyfrowy w świecie pozornego wyboru.',
                'confidenceScore', 0.88,
                'chartSuggestion', jsonb_build_object(
                    'type', 'pie',
                    'xAxisLabel', 'Platforma',
                    'yAxisLabel', 'Udział w streamingu (%)',
                    'dataPoints', jsonb_build_array(
                        jsonb_build_object('label', 'Netflix', 'value', 50),
                        jsonb_build_object('label', 'Max', 'value', 16),
                        jsonb_build_object('label', 'Disney+', 'value', 12),
                        jsonb_build_object('label', 'Inne', 'value', 22)
                    )
                )
            )::text,
            1,
            62,
            4,
            26,
            1,
            198,
            timezone('utc', now()) - interval '50 minutes',
            timezone('utc', now()) - interval '40 minutes',
            timezone('utc', now()) - interval '40 minutes',
            admin_id,
            admin_id,
            '90994b9e-6a5f-4c0c-9a92-7d9fc7644580'
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


