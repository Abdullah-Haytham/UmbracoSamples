namespace UmbracoBlog.Models;

public class Post
{
    public int Id { get; set; }
    public Guid UserId { get; set; } = Guid.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
