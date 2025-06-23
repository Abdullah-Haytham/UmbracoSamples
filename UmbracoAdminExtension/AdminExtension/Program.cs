using AdminExtension.DbContext;
using AdminExtension.Endpoints;
using Microsoft.EntityFrameworkCore;
using Serilog.Context;
using Umbraco.Cms.Api.Management.DependencyInjection;
using Umbraco.Cms.Core;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.CreateUmbracoBuilder()
    .AddBackOfficeCore()
    .AddBackOfficeIdentity()
    .AddBackOffice()
    .AddWebsite()
    .AddComposers()
    .Build();

builder.Services.AddUmbracoDbContext<TodoContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetUmbracoConnectionString("umbracoDbDSN"), sqliteOptions =>
    {
        // Explicitly set the assembly where migrations are located
        sqliteOptions.MigrationsAssembly(typeof(Program).Assembly.FullName);
        // Use a custom history table to avoid conflicts with Umbraco's internal state
        sqliteOptions.MigrationsHistoryTable("__EFMigrationsHistory_Blog");
    });
});

builder.Services.AddAuthentication(options =>
{
    // Set UmbracoBackOffice as the default scheme for authentication challenges
    options.DefaultAuthenticateScheme = Constants.Security.BackOfficeAuthenticationType;
    options.DefaultChallengeScheme = Constants.Security.BackOfficeAuthenticationType;
    options.DefaultSignInScheme = Constants.Security.BackOfficeAuthenticationType; // Explicitly set sign-in scheme
    options.DefaultSignOutScheme = Constants.Security.BackOfficeAuthenticationType; // Explicitly set sign-out scheme
});

WebApplication app = builder.Build();

await app.BootUmbracoAsync();

app.UseHttpsRedirection();

app.UseRouting(); 

app.UseAuthentication(); 
app.UseAuthorization();

app.UseUmbraco()
    .WithMiddleware(u =>
    {
        u.UseBackOffice();
        u.UseWebsite();
    })
    .WithEndpoints(u =>
    {
        u.UseBackOfficeEndpoints();
        u.UseWebsiteEndpoints();

        TodoEndpoints.Map(u.EndpointRouteBuilder);
    });

await app.RunAsync();
