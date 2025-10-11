namespace Antystics.Core.Interfaces;

public interface IImageService
{
    Task<string> AddWatermarkAsync(string imagePath, string watermarkText);
    Task<string> UploadImageAsync(Stream imageStream, string fileName);
    Task<bool> DeleteImageAsync(string imageUrl);
    Task<Stream> GetImageAsync(string imageUrl);
}


