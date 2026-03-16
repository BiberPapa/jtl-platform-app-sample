using HelloWorldApp.Backend.DotNet.Services;

namespace HelloWorldApp.Backend.DotNet.Tests;

public sealed class BackendEnvironmentTests
{
    [Theory]
    [InlineData("prod", "")]
    [InlineData(null, "")]
    [InlineData("dev", ".dev")]
    [InlineData("qa", ".qa")]
    public void GetApiEnvironmentSuffix_ReturnsExpectedValue(string? environment, string expectedSuffix)
    {
        Assert.Equal(expectedSuffix, BackendEnvironment.GetApiEnvironmentSuffix(environment));
    }

    [Theory]
    [InlineData("", "https://auth.jtl-cloud.com/oauth2/token")]
    [InlineData(".beta", "https://auth.jtl-cloud.com/oauth2/token")]
    [InlineData(".qa", "https://auth.qa.jtl-cloud.com/oauth2/token")]
    public void GetAuthEndpoint_ReturnsExpectedValue(string environmentSuffix, string expectedEndpoint)
    {
        Assert.Equal(expectedEndpoint, BackendEnvironment.GetAuthEndpoint(environmentSuffix));
    }

    [Fact]
    public void GetWellKnownEndpoint_ReturnsExpectedValue()
    {
        Assert.Equal(
            "https://api.dev.jtl-cloud.com/account/.well-known/jwks.json",
            BackendEnvironment.GetWellKnownEndpoint(".dev"));
    }
}
