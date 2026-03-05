using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace api.Services;

public class CloudinaryService(IConfiguration config) : ICloudinaryService
{
    private Cloudinary CreateClient()
    {
        var cloudName = config["Cloudinary:CloudName"] ?? throw new InvalidOperationException("Cloudinary:CloudName not configured.");
        var apiKey = config["Cloudinary:ApiKey"] ?? throw new InvalidOperationException("Cloudinary:ApiKey not configured.");
        var apiSecret = config["Cloudinary:ApiSecret"] ?? throw new InvalidOperationException("Cloudinary:ApiSecret not configured.");
        return new Cloudinary(new Account(cloudName, apiKey, apiSecret)) { Api = { Secure = true } };
    }

    public async Task<string> UploadAvatarAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        var cloudinary = CreateClient();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, stream),
            Folder = "avatars",
            Transformation = new Transformation()
                .Width(400).Height(400).Crop("fill").Gravity("face")
                .Quality("auto").FetchFormat("auto"),
        };

        var result = await cloudinary.UploadAsync(uploadParams);

        if (result.Error is not null)
            throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");

        return result.SecureUrl.ToString();
    }
}
