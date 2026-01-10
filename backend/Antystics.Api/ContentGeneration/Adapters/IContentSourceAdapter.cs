using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Api.ContentGeneration.Models;

namespace Antystics.Api.ContentGeneration.Adapters;

public interface IContentSourceAdapter
{
    bool CanHandle(ContentSourceType type);
    Task<IReadOnlyCollection<SourceItem>> FetchAsync(ContentSource source, CancellationToken cancellationToken);
}
