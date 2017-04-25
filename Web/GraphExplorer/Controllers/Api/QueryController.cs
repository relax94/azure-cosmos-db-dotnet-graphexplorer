namespace GraphExplorer.Controllers
{
    using GraphExplorer.Models;
    using GraphExplorer.Utilities;
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using System.Web;
    using System.Web.Http;

    public class QueryController : ApiController
    {
        private const string partionKey = "query";
        private DocumentDBRepository<GraphQuery> dbRepository = new DocumentDBRepository<GraphQuery>();
      
        // GET api/<controller>
        public async Task<IEnumerable<GraphQuery>> Get(string collectionId)
        {
            return await dbRepository.GetItemsAsync(s=>s.Partition.Equals(partionKey), collectionId);
        }

        // GET api/<controller>/5
        /// <summary>
        /// Get document by id.
        /// </summary>
        /// <param name="id">Identifier of document</param>
        /// <returns>Return the document.</returns>
        public async Task<GraphQuery> Get(string id, string collectionId)
        {
            return await dbRepository.GetItemAsync(id, collectionId, partionKey);
        }

        // POST api/<controller>
        /// <summary>
        /// Save Graph Query
        /// </summary>
        /// <param name="value">Data model to save</param>
        /// <returns></returns>
        public async Task Post([FromBody]GraphQuery value, [FromUri]string collectionId)
        {
            if (string.IsNullOrEmpty(value.Id))
            {
                value.Id = Guid.NewGuid().ToString();
            }
            value.Partition = partionKey;
            await dbRepository.CreateItemAsync(value, collectionId); 
        }

        // PUT api/<controller>
        /// <summary>
        /// Update Graph Query
        /// </summary>
        /// <param name="id">The Identifier</param>
        /// <param name="value">Data model to save</param>
        /// <returns></returns>
        public async Task Put(string id, [FromBody]GraphQuery value, [FromUri]string collectionId)
        {
            await dbRepository.UpdateItemAsync(id, value, collectionId);
        }

        // DELETE api/<controller>/5
        /// <summary>
        /// Delete document from doc db.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        public async Task Delete(string id, string collectionId)
        {
            await dbRepository.DeleteItemAsync(id, collectionId);
        }
    }
}