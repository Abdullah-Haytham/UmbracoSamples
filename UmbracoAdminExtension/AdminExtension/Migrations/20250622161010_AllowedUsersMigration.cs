using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdminExtension.Migrations
{
    /// <inheritdoc />
    public partial class AllowedUsersMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "allowed_user_id",
                table: "TodoLists");

            migrationBuilder.CreateTable(
                name: "TodoListAllowedUsers",
                columns: table => new
                {
                    todo_list_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    user_guid = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TodoListAllowedUsers", x => new { x.todo_list_id, x.user_guid });
                    table.ForeignKey(
                        name: "FK_TodoListAllowedUsers_TodoLists_todo_list_id",
                        column: x => x.todo_list_id,
                        principalTable: "TodoLists",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TodoListAllowedUsers");

            migrationBuilder.AddColumn<string>(
                name: "allowed_user_id",
                table: "TodoLists",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }
    }
}
