FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY lnd-gateway.csproj ./
RUN dotnet restore lnd-gateway.csproj

COPY . .
RUN dotnet publish lnd-gateway.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "lnd-gateway.dll"]
