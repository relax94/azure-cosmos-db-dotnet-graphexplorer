namespace GraphExplorer.Models
{
    using Newtonsoft.Json;

    public class GraphSettings
    {
        [JsonProperty("id")]
        public const string Id = "__settings";

        [JsonProperty("_partition")]
        public string Partition { get; set; }

        [JsonProperty("iconGroups")]
        public object IconGroups { get; set; }

        [JsonProperty("options")]
        public object Options { get; set; }
    }
}