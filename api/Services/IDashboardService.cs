using api.DTOs.Admin;

namespace api.Services;

public interface IDashboardService
{
    Task<DashboardResponse> GetAsync(CancellationToken ct = default);
}
