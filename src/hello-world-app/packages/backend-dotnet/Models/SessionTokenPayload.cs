namespace HelloWorldApp.Backend.DotNet.Models;

public sealed record SessionTokenPayload(string UserId, string TenantId);
