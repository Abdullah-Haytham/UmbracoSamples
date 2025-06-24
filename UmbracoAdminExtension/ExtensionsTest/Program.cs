using Our.Umbraco.FullTextSearch;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddFullTextSearch(options =>
    {
        options.DefaultTitleField = "title";
        options.DisallowedContentTypeAliases = new List<string> { "verySecretContent" };
        options.DisallowedPropertyAliases = new List<string> { "hideInSearch" };
        options.Enabled = true;
        options.FullTextPathField = "MyCustomPathField";
        options.FullTextContentField = "MyCustomContentField";
        options.HighlightPattern = "<span class=\"bold\">{0}</span>";
        options.RenderingActiveKey = "HiEverybody!";
        options.XPathsToRemove = new List<string>() { "//script" };
    })
    .AddComposers()
    .Build();

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

await app.RunAsync();
