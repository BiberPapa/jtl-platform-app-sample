using System.Text.Json;
using System.Text.Json.Nodes;

namespace HelloWorldApp.Backend.DotNet.Services;

public static class OpenApiDocumentRewriter
{
    private const string BackendRoutePrefix = "/erp";
    private const string SessionTokenSecuritySchemeName = "SessionTokenHeader";

    public static string? Rewrite(string endpoint, string method, string? contentType, string body)
    {
        if (!ShouldRewrite(endpoint, method, contentType))
        {
            return null;
        }

        if (JsonNode.Parse(body) is not JsonObject document)
        {
            return null;
        }

        var headerParameterComponentNames = GetHeaderParameterComponentNames(document);
        var rewrittenDocument = RewriteNode(document.DeepClone(), headerParameterComponentNames) as JsonObject;

        if (rewrittenDocument is null)
        {
            return null;
        }

        if (!IsOpenApiRootDocument(document))
        {
            return rewrittenDocument.ToJsonString();
        }

        rewrittenDocument["servers"] = new JsonArray(new JsonObject
        {
            ["url"] = "/",
        });
        rewrittenDocument["security"] = new JsonArray(new JsonObject
        {
            [SessionTokenSecuritySchemeName] = new JsonArray(),
        });

        var components = rewrittenDocument["components"] as JsonObject ?? new JsonObject();
        components["securitySchemes"] = new JsonObject
        {
            [SessionTokenSecuritySchemeName] = new JsonObject
            {
                ["type"] = "apiKey",
                ["in"] = "header",
                ["name"] = "X-Session-Token",
            },
        };
        rewrittenDocument["components"] = components;

        if (rewrittenDocument["paths"] is JsonObject paths)
        {
            rewrittenDocument["paths"] = RewritePaths(paths);
        }

        return rewrittenDocument.ToJsonString();
    }

    private static bool IsOpenApiRootDocument(JsonObject document)
    {
        return document["openapi"] is JsonValue || document["swagger"] is JsonValue;
    }

    private static bool ShouldRewrite(string endpoint, string method, string? contentType)
    {
        return string.Equals(method, "GET", StringComparison.OrdinalIgnoreCase)
            && endpoint.EndsWith(".json", StringComparison.OrdinalIgnoreCase)
            && IsJsonContentType(contentType);
    }

    private static bool IsJsonContentType(string? contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType))
        {
            return false;
        }

        return contentType.Contains("application/json", StringComparison.OrdinalIgnoreCase)
            || contentType.Contains("+json", StringComparison.OrdinalIgnoreCase);
    }

    private static HashSet<string> GetHeaderParameterComponentNames(JsonObject document)
    {
        var names = new HashSet<string>(StringComparer.Ordinal);

        if (document["components"] is not JsonObject components || components["parameters"] is not JsonObject parameters)
        {
            return names;
        }

        foreach (var property in parameters)
        {
            if (IsHeaderParameter(property.Value))
            {
                names.Add(property.Key);
            }
        }

        return names;
    }

    private static JsonNode? RewriteNode(JsonNode? node, HashSet<string> headerParameterComponentNames)
    {
        return node switch
        {
            JsonObject jsonObject => RewriteObject(jsonObject, headerParameterComponentNames),
            JsonArray jsonArray => RewriteArray(jsonArray, headerParameterComponentNames),
            JsonValue jsonValue => RewriteValue(jsonValue),
            _ => node?.DeepClone(),
        };
    }

    private static JsonObject RewriteObject(JsonObject node, HashSet<string> headerParameterComponentNames)
    {
        var rewrittenObject = new JsonObject();

        foreach (var property in node)
        {
            if (property.Key == "security")
            {
                continue;
            }

            if (property.Key == "parameters" && property.Value is JsonArray parameterArray)
            {
                rewrittenObject[property.Key] = RewriteParameterArray(parameterArray, headerParameterComponentNames);
                continue;
            }

            if (property.Key == "components" && property.Value is JsonObject components)
            {
                rewrittenObject[property.Key] = RewriteComponents(components, headerParameterComponentNames);
                continue;
            }

            rewrittenObject[property.Key] = RewriteNode(property.Value, headerParameterComponentNames);
        }

        return rewrittenObject;
    }

    private static JsonArray RewriteArray(JsonArray node, HashSet<string> headerParameterComponentNames)
    {
        var rewrittenArray = new JsonArray();

        foreach (var item in node)
        {
            rewrittenArray.Add(RewriteNode(item, headerParameterComponentNames));
        }

        return rewrittenArray;
    }

    private static JsonNode? RewriteValue(JsonValue node)
    {
        if (!node.TryGetValue<string>(out var stringValue))
        {
            return node.DeepClone();
        }

        return JsonValue.Create(RewriteReference(stringValue));
    }

    private static JsonObject RewriteComponents(JsonObject components, HashSet<string> headerParameterComponentNames)
    {
        var rewrittenComponents = new JsonObject();

        foreach (var property in components)
        {
            if (property.Key == "securitySchemes")
            {
                continue;
            }

            if (property.Key == "parameters" && property.Value is JsonObject parameters)
            {
                rewrittenComponents[property.Key] = RewriteParameterComponents(parameters, headerParameterComponentNames);
                continue;
            }

            rewrittenComponents[property.Key] = RewriteNode(property.Value, headerParameterComponentNames);
        }

        return rewrittenComponents;
    }

    private static JsonObject RewriteParameterComponents(JsonObject parameters, HashSet<string> headerParameterComponentNames)
    {
        var rewrittenParameters = new JsonObject();

        foreach (var property in parameters)
        {
            if (headerParameterComponentNames.Contains(property.Key))
            {
                continue;
            }

            rewrittenParameters[property.Key] = RewriteNode(property.Value, headerParameterComponentNames);
        }

        return rewrittenParameters;
    }

    private static JsonArray RewriteParameterArray(JsonArray parameters, HashSet<string> headerParameterComponentNames)
    {
        var rewrittenParameters = new JsonArray();

        foreach (var item in parameters)
        {
            if (IsHeaderParameter(item) || IsHeaderParameterReference(item, headerParameterComponentNames))
            {
                continue;
            }

            rewrittenParameters.Add(RewriteNode(item, headerParameterComponentNames));
        }

        return rewrittenParameters;
    }

    private static JsonObject RewritePaths(JsonObject paths)
    {
        var rewrittenPaths = new JsonObject();

        foreach (var property in paths)
        {
            var normalizedPath = property.Key.StartsWith('/') ? property.Key : $"/{property.Key}";
            rewrittenPaths[$"{BackendRoutePrefix}{normalizedPath}"] = property.Value?.DeepClone();
        }

        return rewrittenPaths;
    }

    private static string RewriteReference(string reference)
    {
        if (reference.StartsWith('#') || Uri.TryCreate(reference, UriKind.Absolute, out _))
        {
            return reference;
        }

        var hashIndex = reference.IndexOf('#');
        var path = hashIndex >= 0 ? reference[..hashIndex] : reference;
        var fragment = hashIndex >= 0 ? reference[hashIndex..] : string.Empty;

        if (!path.StartsWith('/'))
        {
            return reference;
        }

        return $"{BackendRoutePrefix}{path}{fragment}";
    }

    private static bool IsHeaderParameter(JsonNode? node)
    {
        return node is JsonObject parameterObject
            && string.Equals(parameterObject["in"]?.GetValue<string>(), "header", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsHeaderParameterReference(JsonNode? node, HashSet<string> headerParameterComponentNames)
    {
        if (node is not JsonObject parameterReference)
        {
            return false;
        }

        var reference = parameterReference["$ref"]?.GetValue<string>();
        const string componentPrefix = "#/components/parameters/";

        return reference is not null
            && reference.StartsWith(componentPrefix, StringComparison.Ordinal)
            && headerParameterComponentNames.Contains(reference[componentPrefix.Length..]);
    }
}
