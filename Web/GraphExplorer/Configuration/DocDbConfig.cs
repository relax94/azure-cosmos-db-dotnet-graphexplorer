namespace GraphExplorer.Configuration
{
	/// <summary>
	/// Represents a collection of configuration settings for DocDb connection
	/// </summary>
	public class DocDbConfig
	{
		public string ServiceEndpoint { get; set; }
		public string AuthKeyOrResourceToken { get; set; }
		public string DatabaseId { get; set; }
		public string CollectionId { get; set; }
        public string StorageCollectionId { get; set; }
    }
}