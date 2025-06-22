using Umbraco.Cms.Core.Notifications;
using UmbracoBlog.NotificationHandlers;

namespace UmbracoBlog.Composers;

public class AssignMembersToAuthenticatedRoleComposer
{
    public void Compose(IUmbracoBuilder builder)
           => builder.AddNotificationHandler<MemberSavedNotification, AssignMembersToAuthenticatedRoleHandler>();
}
