using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AdminExtension.Models;

public class TodoList
{

    public Guid Id { get; set; }
    public string Name { get; set; } = String.Empty;
    [JsonIgnore]
    public ICollection<TodoListAllowedUser> AllowedUsers { get; set; } = new List<TodoListAllowedUser>();
    public ICollection<TodoItem> TodoItems { get; set; } = [];
}
