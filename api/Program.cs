using System.Text.Json.Serialization;
using api.Config;
using api.Data;
using api.Hubs;
using api.Services;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAuthorization();
builder.Services.AddSignalR()
    .AddJsonProtocol(o => o.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.UseAppSettings();
builder.UseDBSettings();
builder.UseRateLimiting();

builder.Services.AddCors(options =>
{
    var origins = new [] {
      "https://damas.clashapps.com",
      "https://clashapps.com",
    };
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
});

builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// Initialize Firebase Admin SDK (optional — notifications are degraded when unconfigured).
// Provide credentials via ONE of:
//   • Firebase__ServiceAccountJson  — JSON content of the service-account key file
//   • GOOGLE_APPLICATION_CREDENTIALS — path to the service-account key file (ADC)
try
{
    var firebaseJson = builder.Configuration["Firebase:ServiceAccountJson"];
    string credentialSource;
    GoogleCredential firebaseCredential;

    if (!string.IsNullOrWhiteSpace(firebaseJson))
    {
        firebaseCredential = GoogleCredential.FromJson(firebaseJson);
        credentialSource = "Firebase:ServiceAccountJson (config value)";
    }
    else
    {
        var adcPath = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");
        firebaseCredential = GoogleCredential.GetApplicationDefault();
        credentialSource = string.IsNullOrEmpty(adcPath)
            ? "ADC (no GOOGLE_APPLICATION_CREDENTIALS set — using metadata server or well-known file)"
            : $"GOOGLE_APPLICATION_CREDENTIALS={adcPath}";
    }

    FirebaseApp.Create(new AppOptions { Credential = firebaseCredential });
    Console.WriteLine($"[Firebase] Initialized via {credentialSource}");
}
catch (Exception ex)
{
    // Log but do not crash — the app starts without push notifications.
    Console.Error.WriteLine($"[Firebase] Initialization skipped: {ex.Message}");
}

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DamasDbContext>();
    if (db.Database.IsRelational())
        db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
if (!app.Environment.IsEnvironment("Testing"))
    app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapHub<GameHub>("/hubs/game");
app.MapHub<ChatHub>("/hubs/chat");

app.Run();

public partial class Program { }
