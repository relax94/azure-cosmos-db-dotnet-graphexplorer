namespace GraphExplorer.Controllers
{
    using Microsoft.Azure.Graph;
    using Newtonsoft.Json;
    using System.Linq;
    using System.Web.Http;
    using GraphExplorer.Configuration;

    public class GremlinController : ApiController
    {
        static DocDbConfig dbConfig = AppSettings.Instance.GetSection<DocDbConfig>("BuildDemoDocDbConfig");
        
        // Executes a gremlin query and returns the results as a JSON string
        [HttpGet]
        public dynamic Get(string query, string collectionId)
        {
            GraphConnection connection = new GraphConnection(dbConfig.ServiceEndpoint, dbConfig.AuthKeyOrResourceToken, dbConfig.DatabaseId, collectionId);
            var gc = new GraphCommand(connection)
            {
                OutputFormat = OutputFormat.GraphSON,
                CommandText = query
            };

            return JsonConvert.DeserializeObject(gc.Execute().FirstOrDefault());
        }
       
    }
}