# Entities Schema

## Core Entities (`backend/Antystics.Core/Entities/`)

### User
- **Id**: Guid
- **Email, UserName**: string
- **Role**: Enum (User, Moderator, Admin)
- **Provider**: string (for OAuth)
- **Relationships**: HasMany Antistics, Statistics, Likes, Comments, Reports

### Antistic
- **Id**: Guid
- **Title**: string
- **ReversedStatistic**: string (The core content)
- **SourceUrl**: string
- **Status**: Enum (Pending, Approved, Rejected, Flagged)
- **ImageUrl**: string (Generated image)
- **UserId**: Guid (Creator)
- **Relationships**: BelongsTo User, HasMany Likes, Comments, Reports, Categories

### Statistic
- **Id**: Guid
- **Title, Summary**: string
- **SourceUrl**: string
- **TrustPoints, FakePoints**: int
- **Status**: Enum
- **Relationships**: HasMany Votes

### Category
- **Id**: Guid
- **NamePl, NameEn**: string
- **Slug**: string
- **Relationships**: ManyToMany Antistics

### AntisticComment
- **Id**: Guid
- **Content**: string
- **Relationships**: BelongsTo User, BelongsTo Antistic

### AntisticLike / StatisticVote
- Track user engagement.

### VisitorMetric
- **Id**: Guid
- **Date**: DateOnly
- **PageViews**: long
- **UniqueVisitors**: long
- **BotRequests**: long

