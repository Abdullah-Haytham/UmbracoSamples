using AdminExtension.DbContext;
using AdminExtension.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Serilog.Context;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.OperationStatus;
using Umbraco.Cms.Persistence.EFCore.Scoping;

namespace AdminExtension.Endpoints;

public class ToggleTodoItemCompletionRequest
{
    public Guid Id { get; set; }
    public Guid TodoListId { get; set; }
    public bool IsCompleted { get; set; }
}

public class CreateTodoListRequest
{
    public string Name { get; set; }
    public List<string> TodoItemDescriptions { get; set; } = new List<string>();
    public List<Guid> AllowedUserIds { get; set; } = new List<Guid>();
}

public class SimpleUserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
}

public class TodoEndpoints : IEndpoints
{
    public static void Map(IEndpointRouteBuilder self)
    {
        self.MapGroup("/api/todos").MapTodoApi();
        self.MapGroup("/api/users").MapUsersApi();
    }
}

public static class TodoApi
{
    public static RouteGroupBuilder MapTodoApi(this RouteGroupBuilder group)
    {
        group.MapGet("/all", GetAllTodos);
        group.MapPost("/create", CreateTodoList);
        group.MapPost("/toggle-completion", ToggleTodoItemCompletion);
        return group;
    }

    public static RouteGroupBuilder MapUsersApi(this RouteGroupBuilder group)
    {
        group.MapGet("/", GetAllUsers);
        return group;
    }

    public static async Task<IResult> GetAllTodos(IEFCoreScopeProvider<TodoContext> scopeProvider, IBackOfficeSecurityAccessor backOfficeSecurityAccessor, HttpContext httpContext)
    {
        IUser? currentUser = backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser;
        if (currentUser is null)
        {
            return Results.Unauthorized();
        }

        Guid userId = currentUser.Key;

        using IEfCoreScope<TodoContext> scope = scopeProvider.CreateScope();
        IEnumerable<TodoList> lists = await scope.ExecuteWithContextAsync(async db =>
        {
            return await db.TodoLists
                .Include(tl => tl.AllowedUsers)
                .Include(tl => tl.TodoItems)
                .Where(tl => tl.AllowedUsers.Any(aul => aul.UserGuid == userId))
                .ToListAsync();
        });
        scope.Complete();

        if (lists == null || !lists.Any())
        {
            return Results.NotFound();
        }
        return Results.Ok(lists);
    }

    public static async Task<IResult> CreateTodoList(
        IEFCoreScopeProvider<TodoContext> scopeProvider,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        [FromBody] CreateTodoListRequest request)
    {
        IUser? currentUser = backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser;
        if (currentUser is null)
        {
            return Results.Unauthorized();
        }

        TodoList todoList = new TodoList
        {
            Id = Guid.NewGuid(),
            Name = request.Name
        };
        
        todoList.AllowedUsers.Add(new TodoListAllowedUser
        {
            TodoListId = todoList.Id,
            UserGuid = currentUser.Key
        });
        foreach(var userGuid in request.AllowedUserIds.Where(guid => guid != currentUser.Key))
        {
            todoList.AllowedUsers.Add(new TodoListAllowedUser
            {
                TodoListId = todoList.Id,
                UserGuid = userGuid
            });
        }

        foreach (var description in request.TodoItemDescriptions.Where(d => !string.IsNullOrWhiteSpace(d)))
        {
            todoList.TodoItems.Add(new TodoItem
            {
                Id = Guid.NewGuid(),
                Description = description,
                IsCompleted = false,
                TodoListId = todoList.Id
            });
        }

        using IEfCoreScope<TodoContext> scope = scopeProvider.CreateScope();
        await scope.ExecuteWithContextAsync<Task>(async db =>
        {
            db.TodoLists.Add(todoList);
            await db.SaveChangesAsync();
        });
        scope.Complete();
        return Results.Created($"/api/todos/{todoList.Id}", todoList);
    }

    public static async Task<IResult> ToggleTodoItemCompletion(
        IEFCoreScopeProvider<TodoContext> scopeProvider,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        [FromBody] ToggleTodoItemCompletionRequest request)
    {
        IUser? currentUser = backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser;
        if (currentUser is null)
        {
            return Results.Unauthorized();
        }

        using IEfCoreScope<TodoContext> scope = scopeProvider.CreateScope();
        try
        {
            await scope.ExecuteWithContextAsync<Task>(async db =>
            {
                TodoItem? todoItem = await db.TodoItems
                                            .Where(item => item.Id == request.Id && item.TodoListId == request.TodoListId)
                                            .FirstOrDefaultAsync();

                if (todoItem == null)
                {
                    scope.Complete(); 
                    throw new InvalidOperationException("Todo item not found or does not belong to the specified list.");
                }

                todoItem.IsCompleted = request.IsCompleted;

                if (request.IsCompleted)
                {
                    todoItem.CompletedByUserId = currentUser.Key;
                }
                else
                {
                    todoItem.CompletedByUserId = null;
                }

                db.TodoItems.Update(todoItem);
                await db.SaveChangesAsync();
            });
            scope.Complete(); 
            return Results.Ok(); 
        }
        catch (Exception ex)
        {
            // Log the exception for debugging
            // For production, you might want a more generic error message
            return Results.Problem($"An error occurred: {ex.Message}");
        }
    }

    public static async Task<IResult> GetAllUsers(
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        IUserService userService,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 100) 
    {
        IUser? currentUser = backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser;
        if (currentUser is null)
        {
            return Results.Unauthorized();
        }

        Attempt<PagedModel<IUser>?, UserOperationStatus> result = await userService.GetAllAsync(currentUser.Key, skip, take);

        if (result.Success && result.Result != null)
        {
            var simpleUsers = result.Result.Items.Select(u => new SimpleUserDto
            {
                Id = u.Key, 
                Name = u.Name
            }).Where(u => u.Id != currentUser.Key ).ToList();

            return Results.Ok(simpleUsers);
        }
        else
        {
            return Results.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
