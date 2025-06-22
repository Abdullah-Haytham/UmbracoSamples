using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace UmbracoBlog.NotificationHandlers;

public class AssignMembersToAuthenticatedRoleHandler : INotificationHandler<MemberSavedNotification>
{
    private const string RoleName = "Premium";

    private readonly IMemberService _memberService;
    private readonly ILogger<AssignMembersToAuthenticatedRoleHandler> _logger;

    public AssignMembersToAuthenticatedRoleHandler(
        IMemberService memberService,
        ILogger<AssignMembersToAuthenticatedRoleHandler> logger)
    {
        _memberService = memberService;
        _logger = logger;
    }

    public void Handle(MemberSavedNotification notification)
    {
        foreach (IMember member in notification.SavedEntities)
        {
            if (_memberService.GetAllRoles(member.Id).Contains(RoleName))
            {
                continue;
            }
            _logger.LogInformation("Automatically assigning member with ID: {memberId} to role: {roleName}", member.Id, RoleName);
            _memberService.AssignRole(member.Id, RoleName);
        }
    }
}
