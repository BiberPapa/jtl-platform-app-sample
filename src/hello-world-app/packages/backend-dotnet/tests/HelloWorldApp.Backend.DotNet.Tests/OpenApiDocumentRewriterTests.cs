using System.Text.Json.Nodes;
using HelloWorldApp.Backend.DotNet.Services;

namespace HelloWorldApp.Backend.DotNet.Tests;

public sealed class OpenApiDocumentRewriterTests
{
    [Fact]
    public void Rewrite_RewritesErpOpenApiDocumentForBackendUsage()
    {
        var result = OpenApiDocumentRewriter.Rewrite(
            "openapi.json",
            "GET",
            "application/json; charset=utf-8",
            """
            {
              "openapi": "3.0.0",
              "servers": [{ "url": "https://api.jtl-cloud.com/erp" }],
              "security": [{ "bearerAuth": [] }],
              "paths": {
                "/customers": {
                  "get": {
                    "security": [{ "bearerAuth": [] }],
                    "parameters": [
                      { "name": "X-Tenant-ID", "in": "header" },
                      { "name": "limit", "in": "query", "schema": { "type": "integer" } },
                      { "$ref": "#/components/parameters/AuthHeader" }
                    ]
                  }
                }
              },
              "components": {
                "parameters": {
                  "AuthHeader": { "name": "Authorization", "in": "header", "schema": { "type": "string" } },
                  "CustomerId": { "name": "customerId", "in": "path", "required": true, "schema": { "type": "string" } }
                },
                "securitySchemes": {
                  "bearerAuth": { "type": "http", "scheme": "bearer" }
                },
                "schemas": {
                  "Customer": {
                    "properties": {
                      "self": { "$ref": "/schemas/customer.json#/Customer" }
                    }
                  }
                }
              }
            }
            """);

        Assert.NotNull(result);

        var document = JsonNode.Parse(result!)!.AsObject();

        Assert.Equal("/", document["servers"]![0]!["url"]!.GetValue<string>());
        Assert.Equal("/erp/customers", document["paths"]!.AsObject().First().Key);
        Assert.Equal(
            "/erp/schemas/customer.json#/Customer",
            document["components"]!["schemas"]!["Customer"]!["properties"]!["self"]!["$ref"]!.GetValue<string>());
        Assert.Equal(
            "X-Session-Token",
            document["components"]!["securitySchemes"]!["SessionTokenHeader"]!["name"]!.GetValue<string>());
        Assert.Equal(
            "limit",
            document["paths"]!["/erp/customers"]!["get"]!["parameters"]![0]!["name"]!.GetValue<string>());
        Assert.False(document["components"]!["parameters"]!.AsObject().ContainsKey("AuthHeader"));
    }

    [Fact]
    public void Rewrite_KeepsRelativeJsonRefsUnchanged()
    {
        var result = OpenApiDocumentRewriter.Rewrite(
            "schemas/customer.json",
            "GET",
            "application/json",
            """
            {
              "properties": {
                "address": {
                  "$ref": "./address.json#/Address"
                }
              }
            }
            """);

        Assert.NotNull(result);

        var document = JsonNode.Parse(result!)!.AsObject();
        Assert.Equal("./address.json#/Address", document["properties"]!["address"]!["$ref"]!.GetValue<string>());
        Assert.Null(document["servers"]);
    }

    [Fact]
    public void Rewrite_IgnoresNonJsonOrNonGetResponses()
    {
        Assert.Null(OpenApiDocumentRewriter.Rewrite("openapi.json", "POST", "application/json", "{}"));
        Assert.Null(OpenApiDocumentRewriter.Rewrite("customers", "GET", "application/json", "{}"));
    }
}
