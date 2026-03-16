using HelloWorldApp.Backend.DotNet.Models;

namespace HelloWorldApp.Backend.DotNet.Services;

public interface IJtlAuthService
{
    Task<string> GetJwtAsync(CancellationToken cancellationToken);
    Task<SessionTokenPayload> VerifySessionTokenAsync(string sessionToken, CancellationToken cancellationToken);
}
