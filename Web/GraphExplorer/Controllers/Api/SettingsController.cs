namespace GraphExplorer.Controllers
{
    using GraphExplorer.Models;
    using GraphExplorer.Utilities;
    using System.Threading.Tasks;
    using System.Web.Http;

    public class SettingsController : ApiController
    {
        private const string partitionKey = "settings";
        private const string id = "__settings";
        private DocumentDBRepository<GraphSettings> dbRepository = new DocumentDBRepository<GraphSettings>();

        public async Task<GraphSettings> Get(string collectionId)
        {
            return await dbRepository.GetItemAsync(id, collectionId);
        }

        public async Task Post([FromBody]GraphSettings value, [FromUri]string collectionId)
        {
            value.Partition = partitionKey;

            await dbRepository.CreateOrUpdateItemAsync(value, collectionId);
        }

        public async Task Delete(string collectionId)
        {
            await dbRepository.DeleteItemAsync(id, collectionId);
        }
    }
}