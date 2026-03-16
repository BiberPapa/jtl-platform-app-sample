using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using HelloWorldApp.Backend.DotNet.Models;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace HelloWorldApp.Backend.DotNet.Services;

public sealed class JtlAuthService(HttpClient httpClient, TimeProvider timeProvider) : IJtlAuthService
{
    private const int TokenSafetyBufferSeconds = 30;

    private readonly SemaphoreSlim _tokenRefreshLock = new(1, 1);
    private CachedAccessToken? _cachedAccessToken;

    public async Task<string> GetJwtAsync(CancellationToken cancellationToken)
    {
        var cachedToken = GetCachedToken();

        if (cachedToken is not null)
        {
            return cachedToken;
        }

        await _tokenRefreshLock.WaitAsync(cancellationToken);

        try
        {
            cachedToken = GetCachedToken();

            if (cachedToken is not null)
            {
                return cachedToken;
            }

            return await FetchAndCacheJwtAsync(cancellationToken);
        }
        finally
        {
            _tokenRefreshLock.Release();
        }
    }

    public async Task<SessionTokenPayload> VerifySessionTokenAsync(string sessionToken, CancellationToken cancellationToken)
    {
        var jwt = await GetJwtAsync(cancellationToken);
        var environmentSuffix = BackendEnvironment.GetApiEnvironmentSuffix(Environment.GetEnvironmentVariable("API_ENVIRONMENT"));

        using var jwksRequest = new HttpRequestMessage(HttpMethod.Get, BackendEnvironment.GetWellKnownEndpoint(environmentSuffix));
        jwksRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

        using var jwksResponse = await httpClient.SendAsync(jwksRequest, cancellationToken);
        jwksResponse.EnsureSuccessStatusCode();

        var jwksContent = await jwksResponse.Content.ReadAsStringAsync(cancellationToken);
        var jsonWebKeySet = new JsonWebKeySet(jwksContent);
        var signingKeys = jsonWebKeySet.GetSigningKeys();

        if (signingKeys.Count == 0)
        {
            throw new InvalidOperationException("The JWKS endpoint did not return a signing key.");
        }

        var handler = new JsonWebTokenHandler();
        var validationResult = await handler.ValidateTokenAsync(
            sessionToken,
            new TokenValidationParameters
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = signingKeys,
                RequireSignedTokens = true,
            });

        if (!validationResult.IsValid)
        {
            throw new InvalidOperationException(
                $"The session token could not be validated: {validationResult.Exception?.Message ?? "unknown validation error"}");
        }

        var claims = validationResult.ClaimsIdentity?.Claims.ToDictionary(claim => claim.Type, claim => claim.Value)
            ?? new Dictionary<string, string>();
        var userId = GetClaim(claims, "userId");
        var tenantId = GetClaim(claims, "tenantId");

        return new SessionTokenPayload(userId, tenantId);
    }

    private string? GetCachedToken()
    {
        var now = timeProvider.GetUtcNow();

        if (_cachedAccessToken is null || _cachedAccessToken.ExpiresAtUtc <= now)
        {
            _cachedAccessToken = null;
            return null;
        }

        return _cachedAccessToken.Value;
    }

    private async Task<string> FetchAndCacheJwtAsync(CancellationToken cancellationToken)
    {
        var clientId = GetRequiredEnvironmentVariable("CLIENT_ID");
        var clientSecret = GetRequiredEnvironmentVariable("CLIENT_SECRET");
        var environmentSuffix = BackendEnvironment.GetApiEnvironmentSuffix(Environment.GetEnvironmentVariable("API_ENVIRONMENT"));
        var authHeader = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));

        using var request = new HttpRequestMessage(HttpMethod.Post, BackendEnvironment.GetAuthEndpoint(environmentSuffix))
        {
            Content = new FormUrlEncodedContent(
            [
                new KeyValuePair<string, string>("grant_type", "client_credentials"),
            ]),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
        var payload = JsonSerializer.Deserialize<AccessTokenResponse>(responseContent);

        if (!response.IsSuccessStatusCode || string.IsNullOrWhiteSpace(payload?.AccessToken))
        {
            throw new InvalidOperationException(
                $"Failed to fetch JWT ({(int)response.StatusCode}): {payload?.Error ?? "unknown error"}");
        }

        var expiresAtUtc = CalculateExpiryTime(payload.AccessToken, payload.ExpiresIn);

        if (expiresAtUtc is not null)
        {
            _cachedAccessToken = new CachedAccessToken(payload.AccessToken, expiresAtUtc.Value);
        }

        return payload.AccessToken;
    }

    private static string GetRequiredEnvironmentVariable(string name)
    {
        var value = Environment.GetEnvironmentVariable(name);

        return !string.IsNullOrWhiteSpace(value)
            ? value
            : throw new InvalidOperationException($"{name} must be defined in the backend environment.");
    }

    private static string GetClaim(IReadOnlyDictionary<string, string> claims, string name)
    {
        return claims.TryGetValue(name, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : throw new InvalidOperationException("The session token payload is missing required claims.");
    }

    private DateTimeOffset? CalculateExpiryTime(string accessToken, int? expiresInSeconds)
    {
        var now = timeProvider.GetUtcNow();

        if (expiresInSeconds is int expiresIn)
        {
            var expiresAtUtc = now.AddSeconds(expiresIn - TokenSafetyBufferSeconds);

            return expiresAtUtc > now ? expiresAtUtc : null;
        }

        var jsonWebToken = new JsonWebToken(accessToken);

        if (jsonWebToken.ValidTo == DateTime.MinValue)
        {
            return null;
        }

        var expiresAtFromToken = new DateTimeOffset(jsonWebToken.ValidTo).AddSeconds(-TokenSafetyBufferSeconds);

        return expiresAtFromToken > now ? expiresAtFromToken : null;
    }

    private sealed record CachedAccessToken(string Value, DateTimeOffset ExpiresAtUtc);

    private sealed class AccessTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; init; }

        [JsonPropertyName("error")]
        public string? Error { get; init; }

        [JsonPropertyName("expires_in")]
        public int? ExpiresIn { get; init; }
    }
}
