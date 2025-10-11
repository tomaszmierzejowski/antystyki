using Antystics.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Antystics.Infrastructure.Services;

public class StorageService : IStorageService
{
    private readonly IConfiguration _configuration;
    private readonly string _storagePath;

    public StorageService(IConfiguration configuration)
    {
        _configuration = configuration;
        _storagePath = _configuration["Storage:LocalPath"] ?? "uploads";
        
        if (!Directory.Exists(_storagePath))
        {
            Directory.CreateDirectory(_storagePath);
        }
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var filePath = Path.Combine(_storagePath, uniqueFileName);

        using var fileStreamDest = new FileStream(filePath, FileMode.Create);
        await fileStream.CopyToAsync(fileStreamDest);

        // Return relative URL
        return $"/uploads/{uniqueFileName}";
    }

    public Task<bool> DeleteFileAsync(string fileUrl)
    {
        try
        {
            var fileName = Path.GetFileName(fileUrl);
            var filePath = Path.Combine(_storagePath, fileName);
            
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }

    public Task<Stream> DownloadFileAsync(string fileUrl)
    {
        var fileName = Path.GetFileName(fileUrl);
        var filePath = Path.Combine(_storagePath, fileName);
        
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"File not found: {fileUrl}");
        }

        Stream stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        return Task.FromResult(stream);
    }

    public Task<bool> FileExistsAsync(string fileUrl)
    {
        var fileName = Path.GetFileName(fileUrl);
        var filePath = Path.Combine(_storagePath, fileName);
        return Task.FromResult(File.Exists(filePath));
    }
}


