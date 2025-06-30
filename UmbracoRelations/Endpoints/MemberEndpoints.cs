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
        IRelationService relationService)
    {
        if (img == null || img.Length == 0)
        {
            return Results.BadRequest("No image file provided.");
        }

        if (!img.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return Results.BadRequest("Only image files are allowed.");
        }

        try
        {
            // This is the part to get the current member
            int userId = await GetCurrentMemberId(memberManager);
            if (userId == int.MinValue)
                return Results.BadRequest("User not logged in");

            // This is the part to save the media
            const string folderName = "user-uploads";
            int parentFolderId = Constants.System.Root; 

            var rootMedia = mediaService.GetRootMedia();
            IMedia userUploadsFolder = rootMedia
                .FirstOrDefault(m => m.Name.Equals(folderName, StringComparison.OrdinalIgnoreCase) && m.ContentType.Alias == Constants.Conventions.MediaTypes.Folder);

            if (userUploadsFolder == null)
            {
                userUploadsFolder = mediaService.CreateMedia(folderName, Constants.System.Root, Constants.Conventions.MediaTypes.Folder);
                var saveResult = mediaService.Save(userUploadsFolder);

                if (!saveResult.Success)
                {
                    Console.WriteLine($"Error creating folder '{folderName}': {saveResult.Exception?.Message}");
                    return Results.StatusCode(StatusCodes.Status500InternalServerError);
                }
            }

            parentFolderId = userUploadsFolder.Id;

            IMedia newMedia = mediaService.CreateMedia(
                img.FileName,
                parentFolderId, 
                Constants.Conventions.MediaTypes.Image 
            );

            await using (var stream = img.OpenReadStream())
            {
                newMedia.SetValue(
                    mediaFileManager,
                    mediaUrlGenerator,
                    shortStringHelper,
                    contentTypeBaseServiceProvider,
                    Constants.Conventions.Media.File,
                    img.FileName,
                    stream
                );
            }

            mediaService.Save(newMedia); // This line saves the new Media to the database

            // This is the part for Relations
            var relationType = relationService.GetRelationTypeByAlias("userUploads");
            if (relationType == null)
            {

                Guid memberObjectType = Constants.ObjectTypes.Member;
                Guid mediaObjectType = Constants.ObjectTypes.Media;

                // Create a new relation type
                var newRelationType = new RelationType(
                                name: "User Uploads",
                                alias: "userUploads",
                                isBidrectional: true,
                                parentObjectType: memberObjectType,
                                childObjectType: mediaObjectType,
                                isDependency: false 
                            );
                relationService.Save(newRelationType);
                relationType = newRelationType;
                Console.WriteLine($"RelationType 'User Uploads' (userUploads) created successfully.");
            }

            relationService.Relate(userId, newMedia.Id, relationType);
            

            return Results.Ok(new
            {
                Message = $"Image '{newMedia.Name}' uploaded successfully to '{folderName}'!",
                MediaId = newMedia.Id,
                MediaName = newMedia.Name,
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error uploading image: {ex.Message}");
            Console.WriteLine(ex.StackTrace);

            return Results.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}

