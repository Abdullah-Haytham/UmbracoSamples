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
    options.UseSqlite(builder.Configuration.GetUmbracoConnectionString("umbracoDbDSN"));
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
