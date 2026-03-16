using System.Net;
using System.Text;
using HelloWorldApp.Backend.DotNet.Services;

namespace HelloWorldApp.Backend.DotNet.Tests;

public sealed class JtlAuthServiceTests
{
    [Fact]
    public async Task GetJwtAsync_ReusesCachedTokenWhileItIsStillValid()
    {
        var now = new DateTimeOffset(2026, 3, 13, 10, 0, 0, TimeSpan.Zero);
        var handler = new StubHttpMessageHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    $$"""{"access_token":"{{CreateUnsignedJwt(now.AddHours(1).ToUnixTimeSeconds())}}","expires_in":120}""",
                    Encoding.UTF8,
                    "application/json"),
            });
        var authService = CreateAuthService(handler, new FakeTimeProvider(now));

        var firstToken = await authService.GetJwtAsync(CancellationToken.None);
        var secondToken = await authService.GetJwtAsync(CancellationToken.None);

        Assert.Equal(firstToken, secondToken);
        Assert.Equal(1, handler.CallCount);
    }

    [Fact]
    public async Task GetJwtAsync_RefreshesTokenAfterExpiry()
    {
        var now = new DateTimeOffset(2026, 3, 13, 10, 0, 0, TimeSpan.Zero);
        var timeProvider = new FakeTimeProvider(now);
        var callCount = 0;
        var handler = new StubHttpMessageHandler(_ =>
        {
            callCount++;
            var token = callCount == 1
                ? CreateUnsignedJwt(now.AddHours(1).ToUnixTimeSeconds())
                : CreateUnsignedJwt(now.AddHours(2).ToUnixTimeSeconds());

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    $$"""{"access_token":"{{token}}","expires_in":60}""",
                    Encoding.UTF8,
                    "application/json"),
            };
        });
        var authService = CreateAuthService(handler, timeProvider);

        var firstToken = await authService.GetJwtAsync(CancellationToken.None);
        timeProvider.Advance(TimeSpan.FromSeconds(31));
        var secondToken = await authService.GetJwtAsync(CancellationToken.None);

        Assert.NotEqual(firstToken, secondToken);
        Assert.Equal(2, handler.CallCount);
    }

    [Fact]
    public async Task GetJwtAsync_UsesExpClaimWhenExpiresInIsMissing()
    {
        var now = new DateTimeOffset(2026, 3, 13, 10, 0, 0, TimeSpan.Zero);
        var token = CreateUnsignedJwt(now.AddMinutes(2).ToUnixTimeSeconds());
        var handler = new StubHttpMessageHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    $$"""{"access_token":"{{token}}"}""",
                    Encoding.UTF8,
                    "application/json"),
            });
        var authService = CreateAuthService(handler, new FakeTimeProvider(now));

        var firstToken = await authService.GetJwtAsync(CancellationToken.None);
        var secondToken = await authService.GetJwtAsync(CancellationToken.None);

        Assert.Equal(firstToken, secondToken);
        Assert.Equal(1, handler.CallCount);
    }

    [Fact]
    public async Task GetJwtAsync_RefreshesOnlyOnceForConcurrentRequests()
    {
        var now = new DateTimeOffset(2026, 3, 13, 10, 0, 0, TimeSpan.Zero);
        var token = CreateUnsignedJwt(now.AddHours(1).ToUnixTimeSeconds());
        var handler = new StubHttpMessageHandler(async _ =>
        {
            await Task.Delay(25);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    $$"""{"access_token":"{{token}}","expires_in":120}""",
                    Encoding.UTF8,
                    "application/json"),
            };
        });
        var authService = CreateAuthService(handler, new FakeTimeProvider(now));

        var tokens = await Task.WhenAll(
            authService.GetJwtAsync(CancellationToken.None),
            authService.GetJwtAsync(CancellationToken.None));

        Assert.Equal(token, tokens[0]);
        Assert.Equal(token, tokens[1]);
        Assert.Equal(1, handler.CallCount);
    }

    private static JtlAuthService CreateAuthService(HttpMessageHandler handler, TimeProvider timeProvider)
    {
        Environment.SetEnvironmentVariable("CLIENT_ID", "client-id");
        Environment.SetEnvironmentVariable("CLIENT_SECRET", "client-secret");
        Environment.SetEnvironmentVariable("API_ENVIRONMENT", "prod");

        return new JtlAuthService(new HttpClient(handler), timeProvider);
    }

    private static string CreateUnsignedJwt(long expEpochSeconds)
    {
        var header = Convert.ToBase64String(Encoding.UTF8.GetBytes("""{"alg":"none","typ":"JWT"}"""))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        var payload = Convert.ToBase64String(Encoding.UTF8.GetBytes($$"""{"exp":{{expEpochSeconds}}}"""))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

        return $"{header}.{payload}.";
    }

    private sealed class FakeTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        private DateTimeOffset _utcNow = utcNow;

        public override DateTimeOffset GetUtcNow()
        {
            return _utcNow;
        }

        public void Advance(TimeSpan offset)
        {
            _utcNow = _utcNow.Add(offset);
        }
    }

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> responseFactory) : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, Task<HttpResponseMessage>> _responseFactory = responseFactory;

        public int CallCount { get; private set; }

        public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
            : this(request => Task.FromResult(responseFactory(request)))
        {
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            return await _responseFactory(request);
        }
    }
}
