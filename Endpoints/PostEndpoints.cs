using Umbraco.Cms.Persistence.EFCore.Scoping;
using UmbracoBlog.Data;
using UmbracoBlog.Models;

namespace UmbracoBlog.Endpoints;

public class PostEndpoints : IEndpoints
{
    public static void Map(IEndpointRouteBuilder self)
    {
        self.MapGroup("/api/posts").MapPostApi();
    }
}

public static class PostApi
{
    public static RouteGroupBuilder MapPostApi(this RouteGroupBuilder group)
    {
        group.MapGet("/all", GetAllPosts);
        return group;
    }

    public static async Task<IResult> GetAllPosts(IEFCoreScopeProvider<BlogContext> scopeProvider)
    {
        using IEfCoreScope<BlogContext> scope = scopeProvider.CreateScope();
        IEnumerable<Post> posts = await scope.ExecuteWithContextAsync(async db => db.Posts.ToArray());
        scope.Complete();
        if (posts == null || !posts.Any())
        {
            return Results.NotFound();
        }
        return Results.Ok(posts);
    }

    public static async Task<IResult> GetPostById(int id, IEFCoreScopeProvider<BlogContext> scopeProvider)
    {
        using IEfCoreScope<BlogContext> scope = scopeProvider.CreateScope();
        var post = await scope.ExecuteWithContextAsync(async db => db.Posts.FindAsync(id));
        if (post == null)
        {
            return Results.NotFound();
        }
        scope.Complete();
        return Results.Ok(post.Result);
    }

    public static async Task<IResult> CreatePost(Post post, IEFCoreScopeProvider<BlogContext> scopeProvider)
    {
        using IEfCoreScope<BlogContext> scope = scopeProvider.CreateScope();
        await scope.ExecuteWithContextAsync<Task>(async db =>
        {
            db.Posts.Add(post);
            await db.SaveChangesAsync();
        });
        scope.Complete();
        return Results.Created($"/api/posts/{post.Id}", post);
    }
}
