using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;

namespace UmbracoBlog.Migrations;

public class BlogComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder) => builder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, RunBlogMigration>();
}
