using System;
using System.Data.Common;
using System.Security.Claims;
using System.Text;
using Antystics.Api.Extensions;
using Antystics.Core.Entities;
using Antystics.Core.Interfaces;
using Antystics.Infrastructure.Data;
using Antystics.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using Serilog;
using Serilog.Context;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Host.UseSerilog((context, services, loggerConfiguration) =>
{
    loggerConfiguration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("environment", context.HostingEnvironment.EnvironmentName)
        .Enrich.WithProperty("application", "antystics");
});

var sentrySection = builder.Configuration.GetSection("Sentry");
var sentryDsn = sentrySection.GetValue<string>("Dsn");
var sentryEnabled = sentrySection.GetValue<bool>("Enabled");
if (!string.IsNullOrWhiteSpace(sentryDsn) && sentryEnabled)
{
    builder.WebHost.UseSentry(options =>
    {
        options.Dsn = sentryDsn;
        options.Environment = sentrySection.GetValue<string>("Environment");
        options.Release = sentrySection.GetValue<string>("Release");
        options.SendDefaultPii = sentrySection.GetValue<bool>("SendDefaultPii");
        options.TracesSampleRate = sentrySection.GetValue<double?>("TracesSampleRate") ?? 0.0;
    });
}

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();
builder.Services.AddHttpClient("google-oauth", client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
});

// Configure Swagger with JWT authentication
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Antystics API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Database=antystics;Username=postgres;Password=postgres";
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Configure Identity
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 8;
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "your-super-secret-key-change-this-in-production-min-32-chars";
var key = Encoding.ASCII.GetBytes(jwtSecret);

var authenticationBuilder = builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
});

authenticationBuilder.AddJwtBearer(options =>
{
    // ✅ SECURITY: Enforce HTTPS metadata in production
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "Antystics",
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "AntysticsUsers",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
{
    authenticationBuilder.AddGoogle(options =>
    {
        options.ClientId = googleClientId;
        options.ClientSecret = googleClientSecret;
        options.SignInScheme = IdentityConstants.ExternalScheme;
    });
}

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
        {
            var email = context.User.FindFirstValue(ClaimTypes.Email);
            return email is not null && string.Equals(email, "tmierzejowski@gmail.com", StringComparison.OrdinalIgnoreCase);
        });
    });
});

// Register application services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IStorageService, StorageService>();
builder.Services.AddScoped<IImageService, ImageService>();
builder.Services.AddScoped<ISocialAuthService, SocialAuthService>();

builder.Services.AddVisitorMetrics(builder.Configuration);

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        // ✅ SECURITY: Allow both localhost (development) and production domains
        var allowedOrigins = new List<string> 
        { 
            "http://localhost:5173",  // Vite dev server
            "http://localhost:3000"   // Alternative dev port
        };

        // Add production origins from environment variable
        var corsOrigins = builder.Configuration["CORS_ALLOWED_ORIGINS"];
        if (!string.IsNullOrEmpty(corsOrigins))
        {
            allowedOrigins.AddRange(corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                                .Select(o => o.Trim()));
        }

        policy.WithOrigins(allowedOrigins.ToArray())
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.Lifetime.ApplicationStopped.Register(Log.CloseAndFlush);

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ✅ SECURITY: Enforce HTTPS redirection
app.UseHttpsRedirection();

app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers.TryGetValue("X-Correlation-ID", out var rawHeader) &&
                        !string.IsNullOrWhiteSpace(rawHeader.FirstOrDefault())
        ? rawHeader.First()
        : Guid.NewGuid().ToString("N");

    context.Response.Headers["X-Correlation-ID"] = correlationId;
    context.Items["CorrelationId"] = correlationId;

    using (LogContext.PushProperty("CorrelationId", correlationId))
    using (LogContext.PushProperty("RequestPath", context.Request.Path.Value))
    using (LogContext.PushProperty("RequestMethod", context.Request.Method))
    {
        await next();
    }
});

app.UseSerilogRequestLogging();

app.Use(async (context, next) =>
{
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
    try
    {
        await next();

        if (context.Response.StatusCode >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError("Request {Method} {Path} completed with status code {StatusCode}",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode);
        }
    }
    catch (DbException dbException) when (IsDatabaseTimeout(dbException))
    {
        logger.LogError(dbException,
            "Database timeout detected while processing {Method} {Path}",
            context.Request.Method,
            context.Request.Path);

        if (!context.Response.HasStarted)
        {
            context.Response.StatusCode = StatusCodes.Status504GatewayTimeout;
            await context.Response.WriteAsJsonAsync(new
            {
                error = "A database timeout occurred while processing your request."
            });
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex,
            "Unhandled exception occurred while processing {Method} {Path}",
            context.Request.Method,
            context.Request.Path);

        if (!context.Response.HasStarted)
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new
            {
                error = "An unexpected error occurred."
            });
        }
    }
});

// ✅ SECURITY: Add security headers middleware
app.Use(async (context, next) =>
{
    // Prevent clickjacking attacks
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    
    // Prevent MIME type sniffing
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    
    // Enable XSS protection
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    
    // Referrer policy for privacy
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    
    // Content Security Policy (adjusted for Google Fonts and API calls)
    if (!context.Request.Path.StartsWithSegments("/swagger"))
    {
        context.Response.Headers.Append("Content-Security-Policy", 
            "default-src 'self'; " +
            "img-src 'self' data: https:; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com data:; " +
            "connect-src 'self' https://www.google-analytics.com https://region1.analytics.google.com https://region1.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com;" );
    }
    
    // Strict Transport Security (HSTS) - enforce HTTPS
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    
    // Permissions Policy (formerly Feature Policy)
    context.Response.Headers.Append("Permissions-Policy", 
        "geolocation=(), microphone=(), camera=()");

    await next();
});

app.UseVisitorMetrics();

// Serve static files from uploads folder
app.UseStaticFiles();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// ✅ MONITORING: Health check endpoint for deployment validation
app.MapGet("/api/health", async (ApplicationDbContext? dbContext) =>
{
    var health = new
    {
        status = "healthy",
        timestamp = DateTime.UtcNow.ToString("o"),
        version = "1.0.0",
        environment = app.Environment.EnvironmentName,
        database = "unknown"
    };

    try
    {
        if (dbContext != null)
        {
            // Check database connectivity (optional)
            var canConnect = await dbContext.Database.CanConnectAsync();
            health = health with { database = canConnect ? "connected" : "disconnected" };
        }
        
        return Results.Ok(health);
    }
    catch (Exception)
    {
        // Database check failed, but API is still healthy
        health = health with { database = "disconnected" };
        return Results.Ok(health);
    }
});

app.MapControllers();

// ✅ SPA Fallback: Serve React app for all non-API routes
app.MapFallbackToFile("index.html");

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<User>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        
        // Apply migrations
        context.Database.Migrate();
        
        // Seed initial data
        await SeedData(context, userManager, roleManager);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
    }
}

app.Run();

static bool IsDatabaseTimeout(DbException exception)
{
    if (exception is PostgresException postgresException)
    {
        return postgresException.SqlState is "57014" // query canceled
            or "55P03" // lock not available
            or "53300"; // too many connections
    }

    if (exception is TimeoutException || exception.InnerException is TimeoutException)
    {
        return true;
    }

    if (exception.InnerException is DbException dbException)
    {
        return IsDatabaseTimeout(dbException);
    }

    return false;
}

async Task SeedData(ApplicationDbContext context, UserManager<User> userManager, RoleManager<IdentityRole<Guid>> roleManager)
{
    // Create default categories if they don't exist
    if (!context.Categories.Any())
    {
        var categories = new[]
        {
            new Category { NamePl = "Bezpieczeństwo", NameEn = "Safety", Slug = "bezpieczenstwo" },
            new Category { NamePl = "Zdrowie", NameEn = "Health", Slug = "zdrowie" },
            new Category { NamePl = "Technologia", NameEn = "Technology", Slug = "technologia" },
            new Category { NamePl = "Społeczeństwo", NameEn = "Society", Slug = "spoleczenstwo" },
            new Category { NamePl = "Polityka", NameEn = "Politics", Slug = "polityka" },
            new Category { NamePl = "Edukacja", NameEn = "Education", Slug = "edukacja" },
            new Category { NamePl = "Ekonomia", NameEn = "Economy", Slug = "ekonomia" }
        };
        
        context.Categories.AddRange(categories);
        await context.SaveChangesAsync();
    }

    // Create default admin user if none exists
    if (!await userManager.Users.AnyAsync())
    {
        var adminUser = new User
        {
            UserName = "admin",
            Email = "admin@antystyki.pl",
            EmailConfirmed = true,
            Role = UserRole.Admin,
            Provider = "local",
            ProviderUserId = null
        };
        
        await userManager.CreateAsync(adminUser, "Admin123!");
    }
}
