namespace Antystics.Core.Entities;

public class Category
{
    public Guid Id { get; set; }
    public string NamePl { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<AntisticCategory> Antistics { get; set; } = new List<AntisticCategory>();
}

public class AntisticCategory
{
    public Guid AntisticId { get; set; }
    public Guid CategoryId { get; set; }
    
    public virtual Antistic Antistic { get; set; } = null!;
    public virtual Category Category { get; set; } = null!;
}


