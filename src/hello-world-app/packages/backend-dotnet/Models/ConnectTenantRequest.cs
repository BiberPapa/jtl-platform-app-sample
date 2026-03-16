using System.Text.Json.Serialization;

namespace HelloWorldApp.Backend.DotNet.Models;

public sealed record ConnectTenantRequest(
    [property: JsonPropertyName("sessionToken")] string? SessionToken
);
