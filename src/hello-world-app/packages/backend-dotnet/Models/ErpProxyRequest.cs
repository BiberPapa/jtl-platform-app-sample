using System.Text.Json.Nodes;

namespace HelloWorldApp.Backend.DotNet.Models;

public sealed record ErpProxyRequest(string Endpoint, JsonNode? Body);
