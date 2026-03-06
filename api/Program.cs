using api.Config;
using api.Data;
using api.Hubs;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAuthorization();
builder.Services.AddSignalR();

builder.UseAppSettings();
builder.UseDBSettings();

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (allowedOrigins.Length > 0)
            policy.WithOrigins(allowedOrigins);
        else
            policy.AllowAnyOrigin();

        policy
            .AllowAnyHeader()
            .AllowAnyMethod();

        // WithOrigins + AllowCredentials needed for SignalR cookies/auth headers
        if (allowedOrigins.Length > 0)
            policy.AllowCredentials();
    });
});

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

app.Run();

public partial class Program { }
