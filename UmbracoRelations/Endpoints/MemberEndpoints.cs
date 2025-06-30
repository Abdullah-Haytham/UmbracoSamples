using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Infrastructure.Scoping;

namespace Relations.Endpoints;

public class MemberEndpoints : IEndpoints
{
    public static void Map(IEndpointRouteBuilder self)
    {
        self.MapGroup("/members").MapMemberApi();
    }
}

public static class MemberApi
{
    public static RouteGroupBuilder MapMemberApi(this RouteGroupBuilder group)
    {
        group.MapPost("/upload-content", UploadContent);
        return group;
    }

    public static async Task<int> GetCurrentMemberId(IMemberManager memberManager)
    {
        try
        {
            var member  = await memberManager.GetCurrentMemberAsync();
            if(member is null)
                return int.MinValue;
            else
            {
                if(int.TryParse(member.Id, out int id))
                {
                    return id;
                }
                else
                    return int.MinValue;
            }
               
        }
        catch (Exception ex)
        {
            return int.MinValue;
        }
    }
    public static async Task<IResult> UploadContent(
    [FromForm] IFormFile img,
    IMediaService mediaService,
    MediaFileManager mediaFileManager,
    MediaUrlGeneratorCollection mediaUrlGenerator,
    IShortStringHelper shortStringHelper,
    IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
    IMemberManager memberManager,
    IMemberService memberService,
    IRelationService relationService,
    IContentService contentService,
    IScopeProvider scopeProvider
)
    {
        if (img == null || img.Length == 0)
            return Results.BadRequest("No image file provided.");
        if (!img.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return Results.BadRequest("Only image files are allowed.");

        try
        {
            // Get current logged-in member
            int userId = await GetCurrentMemberId(memberManager);
            if (userId == int.MinValue)
                return Results.BadRequest("User not logged in");

            var member = memberService.GetById(userId); // ✅ Synchronous
            if (member == null)
                return Results.BadRequest("Member not found");

            Guid memberKey = member.Key;
            var memberUdi = new GuidUdi(Constants.UdiEntityType.Member, memberKey);

            // Ensure media folder exists
            const string folderName = "user-uploads";
            int parentFolderId = Constants.System.Root;

            var rootMedia = mediaService.GetRootMedia();
            IMedia userUploadsFolder = rootMedia
                .FirstOrDefault(m => m.Name.Equals(folderName, StringComparison.OrdinalIgnoreCase)
                    && m.ContentType.Alias == Constants.Conventions.MediaTypes.Folder);

            if (userUploadsFolder == null)
            {
                userUploadsFolder = mediaService.CreateMedia(folderName, Constants.System.Root, Constants.Conventions.MediaTypes.Folder);
                var saveResult = mediaService.Save(userUploadsFolder);

                if (!saveResult.Success)
                {
                    return Results.StatusCode(StatusCodes.Status500InternalServerError);
                }
            }

            parentFolderId = userUploadsFolder.Id;

            IMedia newMedia = mediaService.CreateMedia(img.FileName, parentFolderId, Constants.Conventions.MediaTypes.Image);
            await using (var stream = img.OpenReadStream())
            {
                newMedia.SetValue(mediaFileManager, mediaUrlGenerator, shortStringHelper, contentTypeBaseServiceProvider,
                    Constants.Conventions.Media.File, img.FileName, stream);
            }

            mediaService.Save(newMedia);

            // Handle relation
            var relationType = relationService.GetRelationTypeByAlias("userUploads");
            if (relationType == null)
            {
                relationType = new RelationType(
                    "User Uploads",
                    "userUploads",
                    isBidrectional: true,
                    parentObjectType: Constants.ObjectTypes.Member,
                    childObjectType: Constants.ObjectTypes.Media,
                    isDependency: false
                );
                relationService.Save(relationType);
            }

            relationService.Relate(userId, newMedia.Id, relationType);

            // --- CREATE MEMBER GALLERY PAGE IF NOT EXISTS ---
            const string listingDocType = "membersListingPage";
            const string galleryDocType = "memberMediaGallery";
            const string galleryMemberProp = "associatedMember";

            using (var scope = scopeProvider.CreateScope(autoComplete: true))
            {
                var homePage = contentService
                    .GetRootContent()
                    .FirstOrDefault(x => x.ContentType.Alias == "home"); // Adjust alias if needed

                if (homePage == null)
                {
                    // Home page not found
                    return Results.StatusCode(StatusCodes.Status500InternalServerError);
                }

                // Then get the membersListingPage under Home
                var listingPage = contentService
                    .GetPagedChildren(homePage.Id, 0, int.MaxValue, out _)
                    .FirstOrDefault(x => x.ContentType.Alias == listingDocType);

                if (listingPage == null)
                {
                    // Listing page not found under Home
                    return Results.StatusCode(StatusCodes.Status500InternalServerError);
                }


                var existingGallery = contentService
                    .GetPagedChildren(listingPage.Id, 0, int.MaxValue, out _)
                    .FirstOrDefault(x =>
                        x.ContentType.Alias == galleryDocType &&
                        x.GetValue<string>(galleryMemberProp) == memberUdi.ToString());

                if (existingGallery == null)
                {
                    var newGallery = contentService.Create($"{member.Name} gallery", listingPage.Id, galleryDocType);
                    newGallery.SetValue(galleryMemberProp, memberUdi.ToString());

                    contentService.Save(newGallery);
                    contentService.Publish(newGallery, cultures: new[] { "*" });
                }
                else if (!existingGallery.Published)
                {
                    contentService.Publish(existingGallery, cultures: new[] { "*" });
                }
            }

            return Results.Ok(new
            {
                Message = $"Image '{newMedia.Name}' uploaded and gallery ensured.",
                MediaId = newMedia.Id,
                MediaName = newMedia.Name
            });
        }
        catch (Exception ex)
        {
            return Results.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}

