using AdminExtension.NotificationHandlers;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;

namespace AdminExtension.Composers;

public class TodoComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder) => builder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, RunTodoMigrations>();
}
