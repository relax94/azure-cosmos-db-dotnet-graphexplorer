using GraphExplorer.Configuration;
using GraphExplorer.Models;
using GraphExplorer.Utilities;
using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Client;
using Microsoft.Azure.Graph;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace GraphExplorer.Controllers.Api
{   
    public class CollectionController : ApiController
    {
        private DocumentDBRepository<string> dbRepository = new DocumentDBRepository<string>();
  
        [HttpGet]
        public dynamic GetCollections()
        {
            DocumentClient client = DocDbSettings.Client;
            Database database = client.CreateDatabaseQuery("SELECT * FROM d WHERE d.id = \"" + DocDbSettings.DatabaseId + "\"").AsEnumerable().FirstOrDefault();
            List<string> collections = client.CreateDocumentCollectionQuery((String)database.SelfLink).Select(s => s.Id).ToList();
            return collections;
        }

        [HttpPost]
        public async Task CreateCollection([FromBody]string name)
        {
            await dbRepository.CreateCollectionIfNotExistsAsync(name);
        }

        [HttpDelete]
        public async Task DeleteCollection(string name)
        {
            await dbRepository.DeleteCollectionAsync(name);
        }

    }
}
