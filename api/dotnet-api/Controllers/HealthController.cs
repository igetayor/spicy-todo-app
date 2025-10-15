using Microsoft.AspNetCore.Mvc;

namespace DotnetApi.Controllers
{
    [ApiController]
    public class HealthController : ControllerBase
    {
        [HttpGet("/")]
        public ActionResult GetRoot()
        {
            return Ok(new
            {
                message = "🌶️ Spicy Todo API - .NET Core Implementation",
                version = "1.0.0",
                docs = "/swagger"
            });
        }

        [HttpGet("/health")]
        public ActionResult GetHealth()
        {
            return Ok(new
            {
                status = "healthy",
                service = "spicy-todo-dotnet-api",
                uptime = DateTime.UtcNow.ToString("O")
            });
        }
    }
}

