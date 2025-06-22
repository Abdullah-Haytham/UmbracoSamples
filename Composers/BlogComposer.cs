using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;
using UmbracoBlog.NotificationHandlers;

namespace UmbracoBlog.Composers;

public class BlogComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder) => builder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, RunBlogMigration>();
}
