/// <reference path="../../../../node_modules/@types/vis/index.d.ts" />
import { HttpClient, json } from 'aurelia-fetch-client';
import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Settings } from './settings';
import { Console } from '../console/console';

declare var vis: any;

interface SavedQuery
{
    id: string;
    title: string;
    query: string;
}

interface Metadata
{
    properties?: any;
    outE?: any;
    inE?: any;
    to?: string;
    from?: string;
    type?: string;
    id?: string;
    label?: string;
    _displayLabel?: string;
}

@inject(HttpClient, EventAggregator)
export class Network
{
    private network: vis.Network;
    private networkContainer: HTMLElement;
    private showConsoleButton: HTMLElement;
    private theConsole: Console;
    private graphMetadata: Metadata;
    private graphMetadataOriginal: Metadata;
    private http: HttpClient;
    private searchString: string;

    modalTypes = { None: 0, SaveQuery: 1, LoadQuery: 2, AddCollection: 3 };
    selectorTypes = { None: 0, Color: 1, Icon: 2 };
    modal = this.modalTypes.None;
    selector = this.selectorTypes.None;

    defaultLabelConstant = '__originalLabel__';
    noLabelConstant = '__noLabel__';

    progressPercent: number;
    progressValue = 0;
    progressText: string;
    loading = false;
    showConfiguration = false;
    redrawOnQuery = true;

    iconGroups = Settings.defaultIconGroups;
    icons = Settings.defaultIcons;
    colors = Settings.defaultColors;
    shapes = Settings.defaultShapes;
    sizableShapes = Settings.sizableShapes;
    selectedShape = this.shapes[0];
    selectedNodeType: string;
    savedQueries: Array<SavedQuery>;
    query = 'g.V()';
    queryTitle: string;
    selectedQuery: SavedQuery;
    nodeTypeSettings: any;

    //bound to inputs, reason for string type
    nodeSize = "25";
    edgeSize = "1";
    iconSize = "25";

    collections: Array<string>;
    selectedCollection: string;
    collectionTitle: string;

    labelMappings: { [label: string]: string } = {};
    selectedLabelProperty: string;

    nodes: any;
    edges: any;

    constructor(http: HttpClient, eventAggregator: EventAggregator)
    {
        this.http = http;
        this.getCollections();



        eventAggregator.subscribe('consoleupdate', response =>
        {
            this.showConsoleButton.classList.add('pulseAnimation');
            setTimeout(() =>
            {
                this.showConsoleButton.classList.remove('pulseAnimation');
            }, 300);
        });
    }

    executeQuery()
    {
        if (!this.query)
        {
            alert('Please enter a query.');
            return;
        }

        this.theConsole.write(this.query);

        this.resetUi();

        this.progressText = "Querying DocumentDB";
        this.loading = true;
        this.http.fetch(`api/gremlin?query=${this.query}&collectionId=${this.selectedCollection}`)
            .then(result => result.json())
            .then((data: any) =>
            {
                if (data && data.length)
                {
                    if (this.redrawOnQuery)
                    {
                        this.renderNetwork(data);
                    }
                    else
                    {
                        this.nicelyEndLoading();
                    }

					this.theConsole.write(data, false);
                }
                else
                {
                    this.theConsole.write('No data returned from query', false);
					this.nicelyEndLoading(true);
                }
            })
            .catch((error) =>
            {
                //todo: handle error/log error
            });
    }

    launchConfiguration()
    {
        this.refreshNodeTypeSettings();

        this.showConfiguration = true;
    }

    shapeChange()
    {
        this.network.setOptions({ nodes: { shape: this.selectedShape } });
        this.saveCurrentSettings();
    }

    sizeChange(event, type)
    {
        if (type != 'icons') //nodes/edges
        {
            this.setNodeOrEdgeSize(type, event.target.value);
        }
        else
        {
            this.setIconSize(event.target.value);
        }

        this.saveCurrentSettings();
    }

    changeIconSetting(type, setting)
    {
        this.selectedNodeType = type;

        if (setting == 'color' && !this.iconGroups[this.selectedNodeType])
        {
            alert('no icon set yet, cannot change color');
        }
        else
        {
            this.selector = setting == 'color' ? this.selectorTypes.Color : this.selectorTypes.Icon;
        }
    }

    iconSelected(icon)
    {
        this.addIconGroup(this.selectedNodeType, icon);
        this.changeNodeIconGroup(this.selectedNodeType);

        this.selectedNodeType = null;
        this.selector = this.selectorTypes.None;

        this.refreshNodeTypeSettings();
    }

    colorSelected(color)
    {
        this.selector = this.selectorTypes.None;

        this.iconGroups[this.selectedNodeType].icon.color = color;
        this.network.setOptions({ groups: this.iconGroups });

        this.refreshNodeTypeSettings();
    }

    labelChange()
    {
        var type = this.graphMetadata.label;
        this.labelMappings[type] = this.selectedLabelProperty;

        //get all nodes of this type, update label to new property
        var nodes = this.nodes.get({ filter: x => x.data.label == type });
        for (let node of nodes)
        {
            node.label = this.getLabelValue(node, this.selectedLabelProperty);

            this.graphMetadata._displayLabel =
                this.selectedLabelProperty == this.noLabelConstant ?
                    node.data.label :
                    node.label;
        }

        this.nodes.update(nodes);
        this.saveCurrentSettings();
    }

    collectionChange()
    {
        this.getSavedQueries();
        this.getSavedSettings();
    }

    private setNodeOrEdgeSize(type, value)
    {
        var opts = {};
        opts[type] = {};
        opts[type][type == 'nodes' ? 'size' : 'width'] = parseInt(value);

        this.network.setOptions(opts);
    }

    private setIconSize(value)
    {
        for (let iconGroup in this.iconGroups)
        {
            this.iconGroups[iconGroup].icon.size = parseInt(value);
        }

        this.network.setOptions({ groups: this.iconGroups });
    }

    private getLabelValue(node, property)
    {
        var label;

        switch (property)
        {
            case this.defaultLabelConstant:
                label = node.data.label;
                break;
            case this.noLabelConstant:
                label = '';
                break;
            default:
                label = node.data.properties[property][0].value;
                break;
        }

        return label;
    }

    private refreshNodeTypeSettings()
    {
        this.nodeTypeSettings = [];

        var types = this.nodes.distinct('_gLabel');

        for (let type of types)
        {
            var group = this.iconGroups[type];

            this.nodeTypeSettings.push({
                type: type,
                icon: group ? group.icon.code : null,
                color: group ? group.icon.color : null
            })
        }

        this.saveCurrentSettings();
    }

    //change visjs nodes group to existing group
    private changeNodeIconGroup(type)
    {
        let nodes = this.nodes.get({ filter: x => x._gLabel == type });

        for (let node of nodes)
        {
            node.group = type;
        }

        this.nodes.update(nodes);
    }

    //add new group to visjs groups
    private addIconGroup(groupName, code)
    {
        //if group exists, just update icon, don't overwrite colors
        if (this.iconGroups[groupName])
        {
            this.iconGroups[groupName].icon.code = code;
        }
        else
        {
            this.iconGroups[groupName] =
                {
                    shape: 'icon',
                    icon:
                    {
                        face: 'Glyphicons Halflings',
                        code: code,
                        size: 25,
                        color: 'black'
                    }
                }
        }

        this.network.setOptions({ groups: this.iconGroups });
    }

    private renderNetwork(data)
    {
        this.progressText = 'Parsing Document DB Result';

        this.nodes = new vis.DataSet();
        this.edges = new vis.DataSet();

        for (let node of data)
        {
            if (node.type == 'vertex' && !this.nodes.get(node.id))
            {
                //do not change _gLabel anywhere, this is the base gremlin node type
                let visNode = { id: node.id, label: node.label, _gLabel: node.label, data: node };

                if (this.iconGroups[node.label])
                {
                    (visNode as any).group = node.label;
                }

                if (this.labelMappings[node.label])
                {
                    visNode.label = this.getLabelValue(visNode, this.labelMappings[node.label]);
                }

                this.nodes.add(visNode);

                if (node.outE)
                {
                    for (let edgeType in node.outE)
                    {
                        let edgeTypeCollection = node.outE[edgeType];

                        for (let edge of edgeTypeCollection)
                        {
                            var visEdge = { from: node.id, to: edge.inV, data: edge };

                            (visEdge as any).hiddenLabel = edgeType;

                            this.edges.add(visEdge);
                        }
                    }
                }
            }
        }

        if (!this.nodes.get().length)
        {
            //no vertices to render, end loading, show console
            this.nicelyEndLoading(true);
        }

        this.progressText = 'Stabilizing Network';

        var options = Settings.defaultGraphOptions;
        options.groups = this.iconGroups;

        this.network = new vis.Network(this.networkContainer, { nodes: this.nodes, edges: this.edges }, options);

        //set persisted values
        this.setIconSize(this.iconSize);
        this.setNodeOrEdgeSize('nodes', this.nodeSize);
        this.setNodeOrEdgeSize('edges', this.edgeSize);

        this.network.on('click', this.click.bind(this));

        this.network.on('hoverEdge', this.hoverEdge.bind(this, true));

        this.network.on('blurEdge', this.hoverEdge.bind(this, false));

        this.network.on("stabilizationProgress", (params) =>
        {
            this.progressPercent = params.iterations / params.total;
            this.progressValue = Math.floor(this.progressPercent * 100);
        });

        this.network.once("stabilizationIterationsDone", (params) =>
        {
            this.nicelyEndLoading();
        });
    }

    private nicelyEndLoading(noGraphRendered?: boolean)
    {
        this.progressPercent = 1;
        this.progressValue = 100;

        setTimeout(() =>
        {
            this.loading = false;

            if (noGraphRendered && !this.theConsole.IsVisible)
            {
                this.theConsole.default();
            }
        }, 500);
    }

    /* manipulating collection methods */
    private getCollections()
    {
        this.http.fetch('api/collection')
            .then(result => result.json())
            .then((data: any) =>
            {
                this.collections = data;
                if (this.collections && this.collections.length > 0)
                {
                    this.selectedCollection = this.collections[0];
                    this.getSavedQueries();
                    this.getSavedSettings();
                }
            })
    }

    private addCollection()
    {
        var postBody = { name: this.collectionTitle };
        this.http.fetch('api/collection', { method: 'post', body: json(postBody) })
            .then((response: any) =>
            {
                this.collectionTitle = '';
                this.modal = this.modalTypes.None;
                this.getCollections();
                this.selectedCollection = this.collectionTitle;
            });
    }
    /* end manipulating collection methods */

    /* saved queries methods */
    private getSavedQueries()
    {
        this.http.fetch(`api/query?collectionId=${this.selectedCollection}`)
            .then(result => result.json())
            .then((data: any) =>
            {
                this.savedQueries = data;
            });
    }

    private loadSavedQuery(query: string)
    {
        this.query = query;
        this.modal = this.modalTypes.None;
        this.executeQuery();
    }

    private deleteSavedQuery(id: string)
    {
        this.http.fetch(`api/query?id=${id}&collectionId=${this.selectedCollection}`, { method: 'delete' })
            .then((response: any) => { this.getSavedQueries(); });
    }

    private saveCurrentQuery()
    {
        var postBody = { title: this.queryTitle, query: this.query };

        this.http.fetch(`api/query?collectionId=${this.selectedCollection}`, { method: 'post', body: json(postBody) })
            .then((response: any) =>
            {
                this.queryTitle = '';
                this.modal = this.modalTypes.None;
                this.getSavedQueries();
            });
    }
    /* end saved queries methods */

    /* saved settings methods */
    private getSavedSettings()
    {
        this.http.fetch(`api/settings?collectionId=${this.selectedCollection}`)
            .then(result => result.json())
            .then((data: any) =>
            {
                if (data)
                {
                    this.iconGroups = data.iconGroups;
                    this.nodeSize = data.options.nodeSize;
                    this.edgeSize = data.options.edgeSize;
                    this.iconSize = data.options.iconSize;
                    this.labelMappings = data.options.labelMappings;
                }
            });
    }

    private saveCurrentSettings()
    {
        var postBody =
            {
                iconGroups: this.iconGroups,
                options:
                {
                    nodeSize: parseInt(this.nodeSize),
                    edgeSize: parseInt(this.edgeSize),
                    iconSize: parseInt(this.iconSize),
                    defaultNodeShape: this.selectedShape,
                    labelMappings: this.labelMappings
                }
            };

        this.http.fetch(`api/settings?collectionId=${this.selectedCollection}`, { method: 'post', body: json(postBody) });
    }
    /* end saved settings methods */

    // resets the progressBar back to start,
    // destroys the network (if it exists)
    // clears out the DOM containing the network's configuration ui
    private resetUi()
    {
        this.showConfiguration = false;
        this.selector = this.selectorTypes.None;
        this.modal = this.modalTypes.None;
        this.graphMetadata = null;
        this.progressValue = 0;
        this.progressPercent = 0;
        this.nodeTypeSettings = [];

        if (this.network && this.redrawOnQuery)
        {
            this.network.destroy();
        }
    }

    private hoverEdge(showLabel, params)
    {
        var edge = this.edges.get(params.edge);
        edge.label = showLabel ? edge.hiddenLabel : undefined;

        this.edges.update(edge);
    }

    private click(params)
    {
        if (this.loading)
        {
            return;
        }

        //create empty object
        this.graphMetadata = {};

        if (params.nodes && params.nodes.length === 1)
        {
            var node = this.nodes.get(params.nodes[0]);
            var nodeDetails = node.data;

            if (nodeDetails)
            {
                //this assign will take care of id, label, properties in a node
                Object.assign(this.graphMetadata, nodeDetails);

                this.graphMetadata._displayLabel = node.label;
                this.selectedLabelProperty = this.labelMappings[node._gLabel] || null;

                //flatten the properties from nodes - instead of xxxx: Array(1), made it xxxx: yyyyy
                if (nodeDetails.properties != null)
                {
                    this.graphMetadata.properties = {};
                    for (var kk in nodeDetails.properties)
                    {
                        this.graphMetadata.properties[kk] = nodeDetails.properties[kk][0].value;
                    }
                }

                this.graphMetadata.type = "Vertex";
            }
        }
        else if (params.edges && params.edges.length === 1)
        {
            var edgeDetails = this.edges.get(params.edges[0]);
            if (edgeDetails)
            {
                //this assign will take care of id, label in an edge
                Object.assign(this.graphMetadata, edgeDetails);

                //we need to move data.properties to properties
                if (edgeDetails.data && edgeDetails.data.properties)
                {
                    this.graphMetadata.properties = {};
                    for (var i in edgeDetails.data.properties)
                    {
                        this.graphMetadata.properties[i] = edgeDetails.data.properties[i];
                    }
                }

                this.graphMetadata.from = this.nodes.get(edgeDetails.from).label;
                this.graphMetadata.to = this.nodes.get(edgeDetails.to).label;
                this.graphMetadata.type = "Edge";
            }
        }

        //if the graphMetadata is empty - made it null
        if (Object.keys(this.graphMetadata).length === 0)
        {
            this.graphMetadata = null;
        }
        else
        {
            //copy graphMetadata object to an original one, graphMetadata will be modified on search and we need to keep a copy of the base one.
            this.graphMetadataOriginal = {};
            Object.assign(this.graphMetadataOriginal, this.graphMetadata);
        }

        this.searchString = '';
    }

    private doFilter(e)
    {
        var filter = e.target.value;

        var result: Metadata = {};
        result.type = this.graphMetadataOriginal.type;
        result.id = this.graphMetadataOriginal.id;
        result.label = this.graphMetadataOriginal.label;

        for (var i in this.graphMetadataOriginal.properties)
        {
            if (this.filterProperty(filter, i, this.graphMetadataOriginal.properties[i]))
            {
                if (!result.properties)
                {
                    result.properties = {};
                }
                result.properties[i] = this.graphMetadataOriginal.properties[i];
            }
        }

        //for nodes
        for (var prop of ["inE", "outE"])
        {
            for (var i in this.graphMetadataOriginal[prop])
            {
                if (this.filterProperty(filter, i, null))
                {
                    if (!result[prop]) 
                    {
                        result[prop] = {};
                    }
                    result[prop][i] = this.graphMetadataOriginal[prop][i];
                }
            }
        }

        //for edges
        for (var prop of ["from", "to"])
        {
            if (this.filterProperty(filter, this.graphMetadataOriginal[prop], null))
            {
                result[prop] = this.graphMetadataOriginal[prop];
            }
        }

        this.graphMetadata = result;
    }

    private filterProperty(filter, prop, value) 
    {
        return ((filter == null || filter === "") ||
            (filter &&
                (prop && prop.toLowerCase().indexOf(filter.toLowerCase()) !== -1 ||
                    (value && value.toString().toLowerCase().indexOf(filter.toLowerCase()) !== -1))));
    }
}

//Class for iterating over object keys
//Used in a repeater where you need to bind to an object (not a simple array or list)
export class KeysValueConverter
{
    toView(obj)
    {
        if (obj)
        {
            var list = Object.keys(obj);
            return list;
        }
    }
}