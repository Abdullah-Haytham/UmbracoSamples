namespace AdminExtension.DbContext;

using AdminExtension.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

public class TodoContext : DbContext
{
    public TodoContext(DbContextOptions<TodoContext> options)
        : base(options)
    {
    }

    public DbSet<TodoList> TodoLists { get; set; }

    public DbSet<TodoItem> TodoItems { get; set; }

    public DbSet<TodoListAllowedUser> TodoListAllowedUsers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure the TodoList entity
        modelBuilder.Entity<TodoList>(entity =>
        {
            entity.ToTable("TodoLists");

            entity.HasKey(l => l.Id);
            entity.Property(l => l.Id).HasColumnName("id");

            entity.Property(l => l.Name)
                .IsRequired()
                .HasMaxLength(100) 
                .HasColumnName("name");

            //entity.Property(l => l.AllowedUserIds)
            //    .HasConversion(
            //        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
            //        v => JsonSerializer.Deserialize<List<Guid>>(v, (JsonSerializerOptions)null) ?? new List<Guid>()
            //    )
            //    .HasColumnType("TEXT")
            //    .HasColumnName("allowed_user_id");
        });

        modelBuilder.Entity<TodoListAllowedUser>(entity =>
        {
            entity.ToTable("TodoListAllowedUsers"); // Define table name for the linking table

            // Define the composite primary key using TodoListId and UserGuid
            entity.HasKey(aul => new { aul.TodoListId, aul.UserGuid });

            // Configure column names for the linking table's properties
            entity.Property(aul => aul.TodoListId).HasColumnName("todo_list_id");
            entity.Property(aul => aul.UserGuid).HasColumnName("user_guid");

            entity.HasOne(aul => aul.TodoList)      
                  .WithMany(tl => tl.AllowedUsers) 
                  .HasForeignKey(aul => aul.TodoListId) 
                  .OnDelete(DeleteBehavior.Cascade); 
        });

        // Configure the TodoItem entity
        modelBuilder.Entity<TodoItem>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Id).HasColumnName("id");

            entity.Property(i => i.Description)
                .IsRequired()
                .HasMaxLength(500) 
                .HasColumnName("description");

            entity.Property(i => i.IsCompleted)
                .IsRequired()
                .HasDefaultValue(false)
                .HasColumnName("is_completed");

            entity.Property(i => i.CompletedByUserId)
                .HasColumnName("completed_by_user_id");

            entity.Property(i => i.TodoListId)
                .IsRequired()
                .HasColumnName("todo_list_id");

            // Configure the one-to-many relationship between TodoList and TodoItem
            entity.HasOne(i => i.TodoList)
                  .WithMany(l => l.TodoItems)   
                  .HasForeignKey(i => i.TodoListId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
