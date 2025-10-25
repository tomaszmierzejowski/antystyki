using Antystics.Api.DTOs;
using Antystics.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Antystics.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public ContactController(IEmailService emailService, IConfiguration configuration)
    {
        _emailService = emailService;
        _configuration = configuration;
    }

    [HttpPost]
    public async Task<IActionResult> SendContactMessage([FromBody] ContactRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || 
            string.IsNullOrWhiteSpace(request.Email) || 
            string.IsNullOrWhiteSpace(request.Subject) || 
            string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "All fields are required" });
        }

        try
        {
            await _emailService.SendContactFormAsync(
                request.Name,
                request.Email,
                request.Subject,
                request.Message
            );

            return Ok(new { message = "Message sent successfully" });
        }
        catch (Exception ex)
        {
            // Log the error
            Console.WriteLine($"Failed to send contact email: {ex.Message}");
            return StatusCode(500, new { message = "Failed to send message" });
        }
    }
}

