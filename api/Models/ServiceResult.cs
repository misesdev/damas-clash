namespace api.Models;

public record ServiceResult<T>(T? Value, string? Error, bool IsSuccess, bool IsNotFound = false)
{
    public static ServiceResult<T> Ok(T value) => new(value, null, true);
    public static ServiceResult<T> Fail(string error) => new(default, error, false);
    public static ServiceResult<T> NotFound(string error) => new(default, error, false, IsNotFound: true);
}
