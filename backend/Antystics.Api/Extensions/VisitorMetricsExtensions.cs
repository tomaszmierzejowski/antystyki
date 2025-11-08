using Antystics.Api.Middleware;
using Antystics.Api.Services.VisitorMetrics;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Antystics.Api.Extensions;

public static class VisitorMetricsExtensions
{
    public static IServiceCollection AddVisitorMetrics(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<VisitorMetricsOptions>(configuration.GetSection("VisitorMetrics"));
        services.AddSingleton<IVisitorMetricsService, VisitorMetricsService>();
        services.AddHostedService<VisitorMetricsHostedService>();
        return services;
    }

    public static IApplicationBuilder UseVisitorMetrics(this IApplicationBuilder app)
    {
        return app.UseMiddleware<VisitorMetricsMiddleware>();
    }
}
