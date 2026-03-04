
using api.Data;
using Microsoft.EntityFrameworkCore;

namespace api.Config;

public static class DBSettings
{
    public static void UseDBSettings(this WebApplicationBuilder builder)
    {
        builder.Services.AddDbContext<DamasDbContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    }
}
