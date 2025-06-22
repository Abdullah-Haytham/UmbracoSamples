using Microsoft.EntityFrameworkCore;
using Serilog.Context;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using UmbracoBlog.Data;

namespace UmbracoBlog.NotificationHandlers;

public class RunBlogMigration(
    ILogger<RunBlogMigration> logger,
    BlogContext blogContext) : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    public async Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Checking for blog migrations...");

        IEnumerable<string> pendingMigrations = await blogContext.Database.GetPendingMigrationsAsync(cancellationToken);
        var pendingMigrationsList = pendingMigrations.ToList();

        if (pendingMigrationsList.Any())
        {
            logger.LogInformation("Found {Count} pending migrations: {Migrations}", pendingMigrationsList.Count, string.Join(", ", pendingMigrationsList));
            await blogContext.Database.MigrateAsync(cancellationToken);
            logger.LogInformation("Blog migrations applied successfully.");
        }
        else
        {
            logger.LogInformation("No pending blog migrations found.");
        }
    }
}
