using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AdminExtension.Models;

public class TodoItem
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsCompleted { get; set; } = false;
    public Guid? CompletedByUserId { get; set; }
    public Guid TodoListId { get; set; }
    [JsonIgnore]
    public TodoList TodoList { get; set; } = new();
}
