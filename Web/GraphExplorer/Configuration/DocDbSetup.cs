using Microsoft.Azure.Documents.Client;
using System;

namespace GraphExplorer.Configuration
{
    public static class DocDbSettings
    {
        private static DocDbConfig dbConfig = AppSettings.Instance.GetSection<DocDbConfig>("BuildDemoDocDbConfig");
        public static string DatabaseId = dbConfig.DatabaseId;
        public static DocumentClient Client;

        public static void Init()
        {
            Client = new DocumentClient(new Uri(dbConfig.ServiceEndpoint), dbConfig.AuthKeyOrResourceToken, new ConnectionPolicy { EnableEndpointDiscovery = false });
        }
    }
}
  

      
