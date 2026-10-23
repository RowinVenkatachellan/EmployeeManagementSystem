
using Microsoft.EntityFrameworkCore;
//Imports Entity Framework Core so we can use its classes, including DbContext and DbSet.
using backend.Models;//Imports the namespace containing our Employee class.

namespace backend.Data
{
    public class AppDbContext : DbContext//Inheritance from DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)//Parameter receiving an object containing database configuration
        //Receives database configuration and passes it to microsoft DbContext
            : base(options)//similar to super
        {
        }

        public DbSet<Employee> Employees { get; set; }//COllection of employee objects
        //DbSet tells efcore we are working with a set of employee entities

        // Configures additional database rules for our Employee entity.
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Creates a unique index on the Email column.
            // Prevents two employees from having the same email address.
            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.Email)
                .IsUnique();
        }
    }
}
//AppDbContext inherits from DbContext to reuse Microsoft's database functionality for retrieving, adding, updating, deleting, and saving employee records.
