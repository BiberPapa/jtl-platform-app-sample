FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY HelloWorldApp.Backend.DotNet.csproj ./
COPY tests/HelloWorldApp.Backend.DotNet.Tests/HelloWorldApp.Backend.DotNet.Tests.csproj ./tests/HelloWorldApp.Backend.DotNet.Tests/
RUN dotnet restore HelloWorldApp.Backend.DotNet.csproj

COPY . .
RUN dotnet publish HelloWorldApp.Backend.DotNet.csproj --configuration Release --output /app/dist

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/dist ./

EXPOSE 50144
ENV ASPNETCORE_URLS=http://0.0.0.0:50144

ENTRYPOINT ["dotnet", "HelloWorldApp.Backend.DotNet.dll"]
