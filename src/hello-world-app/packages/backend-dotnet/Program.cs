using HelloWorldApp.Backend.DotNet.Models;
using HelloWorldApp.Backend.DotNet.Services;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls(Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://0.0.0.0:50144");

builder.Services.AddCors();
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
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(requestBody.SessionToken))
        {
            return Results.BadRequest(new { error = "sessionToken must be provided as a string." });
        }

        await authService.VerifySessionTokenAsync(requestBody.SessionToken, cancellationToken);

        return Results.Json(new { message = "Tenant connected successfully." });
    });

app.MapMethods(
    "/erp-info/{**endpoint}",
    ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    async Task<IResult> (
        HttpRequest request,
        string endpoint,
        IJtlAuthService authService,
        IErpApiClient erpApiClient,
        CancellationToken cancellationToken) =>
    {
        try
        {
            if (!request.Headers.TryGetValue("X-Session-Token", out var sessionTokenValues))
            {
                return Results.BadRequest(new { error = "The X-Session-Token header must be provided." });
            }

            var sessionToken = sessionTokenValues.ToString();

            if (string.IsNullOrWhiteSpace(sessionToken))
            {
                return Results.BadRequest(new { error = "The X-Session-Token header must be provided." });
            }

            var sessionContext = await authService.VerifySessionTokenAsync(sessionToken, cancellationToken);
            var proxyRequest = await ErpProxyRequestBuilder.BuildAsync(request, endpoint, cancellationToken);
            using var erpResponse = await erpApiClient.ForwardAsync(proxyRequest, sessionContext.TenantId, request.Method, cancellationToken);
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
