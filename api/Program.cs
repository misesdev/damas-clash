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

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin();
        policy.AllowAnyHeader().AllowAnyMethod();
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
    GoogleCredential firebaseCredential = !string.IsNullOrWhiteSpace(firebaseJson)
        ? GoogleCredential.FromJson(firebaseJson)
        : GoogleCredential.GetApplicationDefault();

    FirebaseApp.Create(new AppOptions { Credential = firebaseCredential });
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

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapHub<GameHub>("/hubs/game");
app.MapHub<ChatHub>("/hubs/chat");

app.Run();

public partial class Program { }
