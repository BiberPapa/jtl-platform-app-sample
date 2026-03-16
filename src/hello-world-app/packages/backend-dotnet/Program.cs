using HelloWorldApp.Backend.DotNet.Models;
using HelloWorldApp.Backend.DotNet.Services;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls(Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://0.0.0.0:50144");

builder.Services.AddCors();
builder.Services.AddSingleton<ITenantMappingStore, InMemoryTenantMappingStore>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddHttpClient<IJtlAuthService, JtlAuthService>();
builder.Services.AddHttpClient<IErpApiClient, ErpApiClient>();

var app = builder.Build();
app.UseCors(policyBuilder => policyBuilder.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());

app.MapGet("/", () => Results.Text("Hello from TypeScript + Express!"));

app.MapPost(
    "/connect-tenant",
    async Task<IResult> (
        ConnectTenantRequest requestBody,
        IJtlAuthService authService,
        ITenantMappingStore tenantMappingStore,
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(requestBody.SessionToken))
        {
            return Results.BadRequest(new { error = "sessionToken must be provided as a string." });
        }

        var sessionTokenPayload = await authService.VerifySessionTokenAsync(requestBody.SessionToken, cancellationToken);
        var tenantId = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        tenantMappingStore.Save(tenantId, sessionTokenPayload.TenantId);

        return Results.Text(
            $"The tenant ID is {tenantId} and the JTL Platform tenant ID is {sessionTokenPayload.TenantId}");
    });

app.MapMethods(
    "/erp-info/{tenantId}/{endpoint}",
    ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    async Task<IResult> (
        HttpRequest request,
        string tenantId,
        string endpoint,
        IErpApiClient erpApiClient,
        CancellationToken cancellationToken) =>
    {
        try
        {
            var proxyRequest = await ErpProxyRequestBuilder.BuildAsync(request, tenantId, endpoint, cancellationToken);
            using var erpResponse = await erpApiClient.ForwardAsync(proxyRequest, request.Method, cancellationToken);
            var responseContent = await erpResponse.Content.ReadAsStringAsync(cancellationToken);
            var contentType = erpResponse.Content.Headers.ContentType?.ToString() ?? "text/plain";

            return Results.Content(responseContent, contentType, statusCode: (int)erpResponse.StatusCode);
        }
        catch (Exception exception)
        {
            Console.Error.WriteLine($"Error in /erp-info route: {exception}");

            return Results.Json(
                new
                {
                    error = "Failed to fetch ERP info",
                    message = exception.Message,
                },
                statusCode: StatusCodes.Status500InternalServerError);
        }
    });

app.Run();

public partial class Program;
