namespace GraphExplorer.Utilities
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Linq.Expressions;
    using System.Threading.Tasks;
    using GraphExplorer.Configuration;
    using Microsoft.Azure.Documents;
    using Microsoft.Azure.Documents.Client;
    using Microsoft.Azure.Documents.Linq;

    /// <summary>
    /// Document DB generic repository
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class DocumentDBRepository<T> where T : class
    {
      
        private const string partitionKey = "_partition";
   
        /// <summary>
        /// Get the document by id
        /// </summary>
        /// <param name="id">The identifier of document</param>
        /// <returns>Return the document or null</returns>
        public async Task<T> GetItemAsync(string id, string collectionId, string partitionKey=null)
        {
            try
            {
                RequestOptions requestOptions = null;
                if(!string.IsNullOrEmpty(partitionKey))
                {
                    requestOptions = new RequestOptions { PartitionKey = new PartitionKey(partitionKey) };
                }
                    
                Document document = await DocDbSettings.Client.ReadDocumentAsync(UriFactory.CreateDocumentUri(DocDbSettings.DatabaseId, collectionId, id), requestOptions);
                return (T)(dynamic)document;
            }
            catch (DocumentClientException e)
            {
                if (e.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return null;
                }
                else
                {
                    throw;
                }
            }
        }

        /// <summary>
        /// Get all documents for matching predicate
        /// </summary>
        /// <param name="predicate">The predicate</param>
        /// <returns>Returns collection of documents.</returns>
        public async Task<IEnumerable<T>> GetItemsAsync(Expression<Func<T, bool>> predicate, string collectionId)
        {
            IDocumentQuery<T> query = null;
            if (predicate != null)
            {
                query = DocDbSettings.Client.CreateDocumentQuery<T>(
                    UriFactory.CreateDocumentCollectionUri(DocDbSettings.DatabaseId, collectionId),
                    new FeedOptions { MaxItemCount = -1 })
                    .Where(predicate)
                    .AsDocumentQuery();
            }
            else
            {
                query = DocDbSettings.Client.CreateDocumentQuery<T>(
                UriFactory.CreateDocumentCollectionUri(DocDbSettings.DatabaseId, collectionId),
                new FeedOptions { MaxItemCount = -1 })
                .AsDocumentQuery();
            }

            List<T> results = new List<T>();
            while (query.HasMoreResults)
            {
                results.AddRange(await query.ExecuteNextAsync<T>());
            }

            return results;
        }

        /// <summary>
        /// Create a document
        /// </summary>
        /// <param name="item">The input data.</param>
        /// <returns>Returns created document.</returns>
        public async Task<Document> CreateItemAsync(T item, string collectionId)
        {
            return await DocDbSettings.Client.CreateDocumentAsync(UriFactory.CreateDocumentCollectionUri(DocDbSettings.DatabaseId, collectionId), item);
        }

        /// <summary>
        /// Update the document.
        /// </summary>
        /// <param name="id">The identifier</param>
        /// <param name="item">The input data to modify.</param>
        /// <returns></returns>
        public  async Task<Document> UpdateItemAsync(string id, T item, string collectionId)
        {
            return await DocDbSettings.Client.ReplaceDocumentAsync(UriFactory.CreateDocumentUri(DocDbSettings.DatabaseId, collectionId, id), item);
        }

        /// <summary>
        /// Upsert (create or update) the document.
        /// </summary>
        /// <param name="id">The identifier</param>
        /// <param name="item">The input data to modify.</param>
        /// <returns></returns>
        public async Task<Document> CreateOrUpdateItemAsync(T item, string collectionId)
        {
            return await DocDbSettings.Client.UpsertDocumentAsync(UriFactory.CreateDocumentCollectionUri(DocDbSettings.DatabaseId, collectionId), item);
        }

        /// <summary>
        /// Delete the document by id
        /// </summary>
        /// <param name="id">The identifier.</param>
        /// <returns></returns>
        public  async Task DeleteItemAsync(string id, string collectionId, string partitionKey = null)
        {
            RequestOptions requestOptions = null;
            if (!string.IsNullOrEmpty(partitionKey))
            {
                requestOptions = new RequestOptions { PartitionKey = new PartitionKey(partitionKey) };
            }
            await DocDbSettings.Client.DeleteDocumentAsync(UriFactory.CreateDocumentUri(DocDbSettings.DatabaseId, collectionId, id), requestOptions);
        }

        /// <summary>
        /// Create database if not exists
        /// </summary>
        /// <returns></returns>
        private static async Task CreateDatabaseIfNotExistsAsync()
        {
            try
            {
                await DocDbSettings.Client.ReadDatabaseAsync(UriFactory.CreateDatabaseUri(DocDbSettings.DatabaseId));
            }
            catch (DocumentClientException e)
            {
                if (e.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    await DocDbSettings.Client.CreateDatabaseAsync(new Database { Id = DocDbSettings.DatabaseId });
                }
                else
                {
                    throw;
                }
            }
        }

        /// <summary>
        /// Creates collection if not exists
        /// </summary>
        /// <returns></returns>
        public async Task CreateCollectionIfNotExistsAsync(string collectionId)
        {
            try
            {
                await DocDbSettings.Client.ReadDocumentCollectionAsync(UriFactory.CreateDocumentCollectionUri(DocDbSettings.DatabaseId, collectionId));
            }
            catch (DocumentClientException e)
            {
                if (e.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    var partitionKey = new PartitionKeyDefinition() { Paths = new System.Collections.ObjectModel.Collection<string>() { "/_partition" } };
                    await DocDbSettings.Client.CreateDocumentCollectionAsync(
                        UriFactory.CreateDatabaseUri(DocDbSettings.DatabaseId),
                        new DocumentCollection { Id = collectionId, PartitionKey = partitionKey },
                        new RequestOptions { OfferThroughput = 1000 });
                }
                else
                {
                    throw;
                }
            }
        }
        
        /// <summary>
        /// Creates collection if not exists
        /// </summary>
        /// <returns></returns>
        public async Task DeleteCollectionAsync(string collectionId)
        {
            try
            {
                await DocDbSettings.Client.DeleteDocumentCollectionAsync(UriFactory.CreateDocumentCollectionUri(DocDbSettings.DatabaseId, collectionId));
            }
            catch (DocumentClientException e)
            {
                //todo
                throw;
            }
        }
    }
}