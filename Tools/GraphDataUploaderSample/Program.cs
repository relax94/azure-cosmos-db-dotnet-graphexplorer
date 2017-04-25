using Microsoft.Azure.Graph;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GraphDataUploaderSample
{
    class Entity
    {
        public string Name { get; set; }

        public string PathToData { get; set; }

        public List<string> Attributes { get; set; }
    }

    class Edge : Entity
    {
        public string SourceNode { get; set; }

        public string DestinationNode { get; set; }
    }

    class Node : Entity
    {
        public string NodeIdAttribute { get; set; }
    }

    class GraphConfig
    {
        public List<Node> Nodes { get; set; }

        public List<Edge> Edges { get; set; }
    }

    class Program
    {
        static Dictionary<string, Node> Nodes;
        static Dictionary<string, Edge> Edges;
        static GraphConnection connection = null;
        static List<string> errors = new List<string>();

        static void Main(string[] args)
        {
            connection = new GraphConnection(
            ConfigurationManager.AppSettings["DocDBEndPoint"],
            ConfigurationManager.AppSettings["DocDBKey"],
            ConfigurationManager.AppSettings["DocDBDatabase"],
            ConfigurationManager.AppSettings["DocDBCollection"]);

            int maxTasks = 1;
            int.TryParse(ConfigurationManager.AppSettings["MaxTasks"], out maxTasks);

            // Processing GraphConfig
            string configPath = ConfigurationManager.AppSettings["GraphConfigFile"];
            string graphConfigText = System.IO.File.ReadAllText(configPath);
            GraphConfig graphConfig = JsonConvert.DeserializeObject<GraphConfig>(graphConfigText);

            Nodes = new Dictionary<string, Node>();
            Edges = new Dictionary<string, Edge>();
            foreach(var node in graphConfig.Nodes)
            {
                Nodes.Add(node.Name, node);
            }

            foreach (var edge in graphConfig.Edges)
            {
                Edges.Add(edge.Name, edge);
            }

            List<Task<bool>> tasks = new List<Task<bool>>();

            // Upload nodes
            foreach (var nodeItem in Nodes)
            {
                if (tasks.Count == maxTasks)
                {
                    Task.WhenAll(tasks).Wait();
                    tasks.Clear();
                }

                tasks.Add(UploadNode(nodeItem.Value));
            }

            if (tasks.Count > 0)
            {
                Task.WhenAll(tasks).Wait();
                tasks.Clear();
            }

            Console.WriteLine("Uploaded Nodes");

            // Upload edges   
            foreach (var edgeItem in Edges)
            {
                if (tasks.Count == maxTasks)
                {
                    Task.WhenAll(tasks).Wait();
                    tasks.Clear();
                }

                tasks.Add(UploadEdge(edgeItem.Value));
            }

            if (tasks.Count > 0)
            {
                Task.WhenAll(tasks).Wait();
                tasks.Clear();
            }

            Console.WriteLine("Uploaded Edges");

            System.IO.File.WriteAllLines(ConfigurationManager.AppSettings["ErrorLogPath"], errors);
            Console.WriteLine("Graph uploaded ! " + (errors.Count == 0 ? "" : ("But there were " + errors.Count + " errors. Please check the log file.")));
            Console.Read();
        }

        static async Task<bool> UploadNode(Node node)
        {
            GraphCommand gc = new GraphCommand(Program.connection);

            // Get list of all files in the directory for this node
            List<string> files = System.IO.Directory.GetFiles(node.PathToData).ToList();
            foreach(string filePath in files)
            {
                List<string> lines = System.IO.File.ReadAllLines(filePath).ToList();
                foreach (var line in lines)
                {
                    List<string> values = line.Split('\t').ToList();
                    try
                    {
                        var instr = gc.g().AddV(node.Name);
                        for (int i = 0; i < values.Count; i++)
                        {
                            instr = instr.Property(node.Attributes[i], values[i]);
                        }

                        List<string> result = await instr.NextAsync();
                        if (result.Count == 0 || result[0] == "[]")
                            throw new Exception("Could not insert node");
                    }
                    catch (Exception ex)
                    {
                        errors.Add(node.Name + " (" + ex + ") : " + JsonConvert.SerializeObject(values) + "\n");
                    }
                }
            }

            return true;
        }

        static async Task<bool> UploadEdge(Edge edge)
        {
            string sourceNodePrimaryKey = Nodes[edge.SourceNode].NodeIdAttribute;
            string destNodePrimaryKey = Nodes[edge.DestinationNode].NodeIdAttribute;

            GraphCommand gc = new GraphCommand(Program.connection);

            // Get list of all files in the directory for this edge
            List<string> files = System.IO.Directory.GetFiles(edge.PathToData).ToList();
            foreach (string filePath in files)
            {
                List<string> lines = System.IO.File.ReadAllLines(filePath).ToList();
                foreach (var line in lines)
                {
                    List<string> values = line.Split('\t').ToList();
                    Dictionary<string, string> keyval = new Dictionary<string, string>();
                    for (int i = 0; i < edge.Attributes.Count; i++)
                    {
                        keyval.Add(edge.Attributes[i], values[i]);
                    }

                    try
                    {
                        var instr = gc.g().V().As("v").Has(sourceNodePrimaryKey, keyval[sourceNodePrimaryKey]).AddE(edge.SourceNode + edge.DestinationNode);
                        foreach (var item in keyval)
                        {
                            if (item.Key != sourceNodePrimaryKey && item.Key != destNodePrimaryKey)
                                instr = instr.Property(item.Key, item.Value);
                        }

                        instr = instr.To(gc.g().V().Has(destNodePrimaryKey, keyval[destNodePrimaryKey]));
                        List<string> res = await instr.NextAsync();
                        if (res.Count == 0 || res[0] == "[]")
                            throw new Exception("could not insert edge");
                    }
                    catch (Exception ex)
                    {
                        errors.Add(edge.Name + " (" + ex + ") : " + JsonConvert.SerializeObject(keyval) + "\n");
                    }
                }
            }

            return true;
        }
    }
}