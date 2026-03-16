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
        HttpRequest request,
        IJtlAuthService authService,
        CancellationToken cancellationToken) =>
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

        await authService.VerifySessionTokenAsync(sessionToken, cancellationToken);

        return Results.Json(new { message = "Tenant connected successfully." });
    });

app.MapMethods(
    "/erp/{**endpoint}",
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
            using var erpResponse = await erpApiClient.ForwardAsync(
                proxyRequest,
                sessionContext.TenantId,
                sessionToken,
                request.Method,
                cancellationToken);
            var responseContent = await erpResponse.Content.ReadAsStringAsync(cancellationToken);
            var contentType = erpResponse.Content.Headers.ContentType?.ToString() ?? "text/plain";
            var rewrittenOpenApiDocument = OpenApiDocumentRewriter.Rewrite(endpoint, request.Method, contentType, responseContent);

            return Results.Content(
                rewrittenOpenApiDocument ?? responseContent,
                contentType,
                statusCode: (int)erpResponse.StatusCode);
        }
        catch (Exception exception)
        {
            Console.Error.WriteLine($"Error in /erp route: {exception}");

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
