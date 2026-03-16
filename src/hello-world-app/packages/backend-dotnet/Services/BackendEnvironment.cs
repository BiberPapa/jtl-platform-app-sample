namespace HelloWorldApp.Backend.DotNet.Services;

public static class BackendEnvironment
{
    public static string GetApiEnvironmentSuffix(string? apiEnvironment)
    {
        var normalizedEnvironment = string.IsNullOrWhiteSpace(apiEnvironment) ? "prod" : apiEnvironment.Trim();

        return normalizedEnvironment == "prod" ? string.Empty : $".{normalizedEnvironment}";
    }

    public static string GetAuthEndpoint(string environmentSuffix)
    {
        return environmentSuffix is "" or ".beta"
            ? "https://auth.jtl-cloud.com/oauth2/token"
            : $"https://auth{environmentSuffix}.jtl-cloud.com/oauth2/token";
    }

    public static string GetWellKnownEndpoint(string environmentSuffix)
    {
        return $"https://api{environmentSuffix}.jtl-cloud.com/account/.well-known/jwks.json";
    }
}
