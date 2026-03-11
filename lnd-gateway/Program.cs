using lnd_gateway.Configuration;
using lnd_gateway.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.UseAppSetup();

builder.Services.AddControllers();

var app = builder.Build();

if (!app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "LND Gateway v1"));
}

app.UseMiddleware<ApiKeyMiddleware>();
app.MapControllers();

app.Run();

public partial class Program { }
