namespace api.Services;

public interface ICloudinaryService
{
    Task<string> UploadAvatarAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default);
}
