namespace AdminExtension.Endpoints;

public interface IEndpoints
{
    static abstract void Map(IEndpointRouteBuilder self);

    static string GetRequestHost(HttpContext context) => $"{context.Request.Scheme}://{context.Request.Host}/";
}
