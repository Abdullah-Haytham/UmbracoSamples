using Microsoft.EntityFrameworkCore;
using UmbracoBlog.Data;
using UmbracoBlog.Endpoints;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddComposers()
    .Build();

builder.Services.AddUmbracoDbContext<BlogContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetUmbracoConnectionString("umbracoDbDSN"), sqliteOptions =>
    {
        // Explicitly set the assembly where migrations are located
        sqliteOptions.MigrationsAssembly(typeof(Program).Assembly.FullName);
        // Use a custom history table to avoid conflicts with Umbraco's internal state
        sqliteOptions.MigrationsHistoryTable("__EFMigrationsHistory_Blog");
    });
});

WebApplication app = builder.Build();

await app.BootUmbracoAsync();

app.UseHttpsRedirection();

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
    });

PostEndpoints.Map(app);

await app.RunAsync();
