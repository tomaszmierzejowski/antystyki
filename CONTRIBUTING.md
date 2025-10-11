# Contributing to Antystics

Thank you for your interest in contributing to Antystics! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Follow content guidelines (no hate speech, harassment, or calls to violence)
- Focus on constructive criticism
- Help maintain a positive community

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/antystics/issues)
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, etc.)

### Suggesting Features

1. Check if the feature has been suggested
2. Open a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Mockups or examples if applicable

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following the coding standards below
4. Write/update tests if applicable
5. Update documentation if needed
6. Commit with clear messages: `git commit -m "Add: feature description"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots/demos if applicable

## Development Setup

See [README.md](README.md) for setup instructions.

## Coding Standards

### Backend (.NET)

- Follow [C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- Use async/await for asynchronous operations
- Properly handle exceptions
- Add XML comments to public APIs
- Use dependency injection
- Keep controllers thin, logic in services

Example:
```csharp
/// <summary>
/// Creates a new antistic
/// </summary>
/// <param name="request">The antistic creation request</param>
/// <returns>Created antistic details</returns>
[HttpPost]
public async Task<IActionResult> CreateAntistic([FromBody] CreateAntisticRequest request)
{
    // Implementation
}
```

### Frontend (React + TypeScript)

- Use functional components with hooks
- Follow [Airbnb React Style Guide](https://github.com/airbnb/javascript/tree/master/react)
- Use TypeScript for type safety
- Keep components small and focused
- Use meaningful variable/function names
- Add PropTypes or TypeScript interfaces

Example:
```typescript
interface Props {
  antistic: Antistic;
  onLike?: (id: string) => void;
}

const AntisticCard: React.FC<Props> = ({ antistic, onLike }) => {
  // Implementation
};
```

### CSS (Tailwind)

- Use Tailwind utility classes
- Keep custom CSS minimal
- Use responsive design utilities
- Follow mobile-first approach

## Testing

### Backend Tests

```bash
cd backend
dotnet test
```

Add tests for:
- Controllers
- Services
- Validators
- Complex business logic

### Frontend Tests

```bash
cd frontend
npm run test
```

Add tests for:
- Components
- Utilities
- Hooks
- API calls

## Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add user profile page`
- `fix: resolve login redirect issue`
- `docs: update API documentation`
- `style: format code with prettier`
- `refactor: reorganize antistic service`
- `test: add tests for auth controller`
- `chore: update dependencies`

## Branch Naming

- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/doc-name` - Documentation
- `refactor/refactor-name` - Code refactoring
- `test/test-name` - Adding tests

## Content Guidelines

### Creating Antistics

When adding default or example antistics:

✅ **Good Examples**:
- "92.4% of traffic accidents were caused by sober drivers"
- "99% of successful people failed before they succeeded"
- "Most lottery winners had never won before"

❌ **Bad Examples**:
- Targeting specific individuals
- Promoting hate or violence
- False information without source
- Offensive content

### Moderation

Contributors helping with moderation should:
- Review source links
- Ensure humor is appropriate
- Check for offensive content
- Verify data interpretation is fair

## Database Migrations

When making schema changes:

```bash
# Create migration
cd backend
dotnet ef migrations add YourMigrationName --project Antystics.Infrastructure --startup-project Antystics.Api

# Update database
dotnet ef database update --project Antystics.Infrastructure --startup-project Antystics.Api
```

## Documentation

- Update README.md for major features
- Add/update API documentation
- Update deployment guides if needed
- Add code comments for complex logic
- Update CHANGELOG.md

## Review Process

1. Automated checks (CI/CD)
2. Code review by maintainers
3. Testing in staging environment
4. Approval and merge

## Getting Help

- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/antystics/discussions)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/antystics/issues)
- 📧 Email: dev@antystyki.pl

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Given contributor badge (if applicable)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to Antystics!** 🎉



