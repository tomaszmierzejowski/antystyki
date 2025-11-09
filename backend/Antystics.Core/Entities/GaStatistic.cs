using System;

namespace Antystics.Core.Entities;

public class GaStatistic
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public long TotalPageViews { get; set; }
    public long UniqueVisitors { get; set; }
    public long TotalBotRequests { get; set; }
    public long UniqueBots { get; set; }
    public long HumanPageViews { get; set; }
}
