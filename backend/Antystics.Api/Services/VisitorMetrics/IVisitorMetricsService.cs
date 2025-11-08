using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Antystics.Api.Services.VisitorMetrics;

public interface IVisitorMetricsService
{
    void RegisterVisit(DateTime timestampUtc, string ipAddress, string? userAgent, string path, bool isBot);

    IReadOnlyList<VisitorDailySummary> GetDailySummaries(DateOnly fromDate, DateOnly toDate);

    Task PersistAsync(CancellationToken cancellationToken);

    void RemoveExpiredData(DateOnly minimumDateToKeep);
}
