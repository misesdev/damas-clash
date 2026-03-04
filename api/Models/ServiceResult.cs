namespace api.Models;

public record ServiceResult<T>(T? Value, string? Error, bool IsSuccess)
{
    public static ServiceResult<T> Ok(T value) => new(value, null, true);
    public static ServiceResult<T> Fail(string error) => new(default, error, false);
}
