using Antystics.Core.Interfaces;
using SixLabors.Fonts;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Drawing.Processing;
using SixLabors.ImageSharp.Processing;

namespace Antystics.Infrastructure.Services;

public class ImageService : IImageService
{
    private readonly IStorageService _storageService;

    public ImageService(IStorageService storageService)
    {
        _storageService = storageService;
    }

    public async Task<string> AddWatermarkAsync(string imagePath, string watermarkText)
    {
        using var imageStream = await _storageService.DownloadFileAsync(imagePath);
        using var image = await Image.LoadAsync(imageStream);

        // Add watermark to bottom-right corner
        var font = SystemFonts.CreateFont("Arial", 24, FontStyle.Bold);
        var textOptions = new RichTextOptions(font)
        {
            Origin = new System.Numerics.Vector2(image.Width - 250, image.Height - 50),
            HorizontalAlignment = HorizontalAlignment.Right,
            VerticalAlignment = VerticalAlignment.Bottom
        };

        // Draw white text with black outline
        var drawingOptions = new DrawingOptions();
        var textBrush = Brushes.Solid(Color.White);
        var pen = Pens.Solid(Color.Black, 2);
        
        image.Mutate(ctx => ctx
            .DrawText(drawingOptions, textOptions, watermarkText, textBrush, pen)
        );

        using var outputStream = new MemoryStream();
        await image.SaveAsPngAsync(outputStream);
        outputStream.Position = 0;

        var fileName = $"watermarked_{Guid.NewGuid()}.png";
        return await _storageService.UploadFileAsync(outputStream, fileName, "image/png");
    }

    public async Task<string> UploadImageAsync(Stream imageStream, string fileName)
    {
        return await _storageService.UploadFileAsync(imageStream, fileName, "image/png");
    }

    public async Task<bool> DeleteImageAsync(string imageUrl)
    {
        return await _storageService.DeleteFileAsync(imageUrl);
    }

    public async Task<Stream> GetImageAsync(string imageUrl)
    {
        return await _storageService.DownloadFileAsync(imageUrl);
    }
}

