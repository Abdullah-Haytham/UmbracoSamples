namespace AdminExtension.Models;

public class TodoListAllowedUser
{
    public Guid TodoListId { get; set; }
    public TodoList TodoList { get; set; }
    public Guid UserGuid { get; set; }
}
