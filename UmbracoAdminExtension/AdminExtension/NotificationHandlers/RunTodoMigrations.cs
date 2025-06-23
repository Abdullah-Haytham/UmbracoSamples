using AdminExtension.DbContext;
using Serilog.Context;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Microsoft.EntityFrameworkCore;

namespace AdminExtension.NotificationHandlers;

public class RunTodoMigrations(
ILogger<RunTodoMigrations> logger,
TodoContext todoContext) : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    public async Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Checking for todo migrations...");

        IEnumerable<string> pendingMigrations = await todoContext.Database.GetPendingMigrationsAsync(cancellationToken);
        var pendingMigrationsList = pendingMigrations.ToList();

        if (pendingMigrationsList.Any())
        {
            logger.LogInformation("Found {Count} pending migrations: {Migrations}", pendingMigrationsList.Count, string.Join(", ", pendingMigrationsList));
            await todoContext.Database.MigrateAsync(cancellationToken);
            logger.LogInformation("Todo migrations applied successfully.");
        }
        else
        {
            logger.LogInformation("No pending Todo migrations found.");
        }
    }
}
