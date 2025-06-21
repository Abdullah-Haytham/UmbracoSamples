using Microsoft.EntityFrameworkCore;
using Serilog.Context;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using UmbracoBlog.Data;

namespace UmbracoBlog.Migrations;

public class RunBlogMigration(BlogContext blogContext) : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    public async Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        IEnumerable<string> pendingMigrations = await blogContext.Database.GetPendingMigrationsAsync(cancellationToken);

        if (pendingMigrations.Any())
        {
            await blogContext.Database.MigrateAsync();
        }
    }
}
