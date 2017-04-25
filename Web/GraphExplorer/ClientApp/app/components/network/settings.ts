export interface IconDefinition
{
    face: string;
    code: string;
    size: number;
    color: string;
}

export interface IconGroup
{
    shape: string;
    icon: IconDefinition;
}

export class Settings
{
    constructor()
    {
        throw new Error("Cannot new this class");
    }

    static defaultShapes: Array<string> = ['box', 'ellipse', 'database', 'text', 'diamond', 'dot', 'star', 'triangle', 'triangleDown', 'square']

    static defaultColors: Array<string> = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']

    static sizableShapes: Array<string> = ['square', 'triangleDown', 'triangle', 'star', 'dot', 'diamond']

    static defaultIcons: Array<string> = [
        '\u002a', //asterisk
        '\u2709', //envelope
        '\u270f', //pencil
        '\ue005', //heart
        '\ue008', //user
        '\ue009', //film
        '\ue021', //house
        '\ue022', //file
        '\ue035', //headphones
        '\ue041', //tag,
        '\ue046', //camera
        '\ue043' //book
    ]

    static defaultIconGroups: { [name: string]: IconGroup } =
    {
        Jason:
        {
            shape: 'icon',
            icon:
            {
                face: 'Glyphicons Halflings',
                code: '\u002A',
                size: 25,
                color: 'red'
            }
        },
        Stephen:
        {
            shape: 'icon',
            icon:
            {
                face: 'Glyphicons Halflings',
                code: '\ue008',
                size: 25,
                color: 'limegreen'
            }
        },
        'This Graph':
        {
            shape: 'icon',
            icon:
            {
                face: 'Glyphicons Halflings',
                code: '\ue022',
                size: 25,
                color: 'gray'
            }
        },

        //TODO: test icons, please replace
        Organization:
        {
            shape: 'icon',
            icon:
            {
                face: 'Glyphicons Halflings',
                code: '\ue021',
                size: 25,
                color: 'black'
            }
        },
        Agreement:
        {
            shape: 'icon',
            icon:
            {
                face: 'Glyphicons Halflings',
                code: '\u270f',
                size: 25,
                color: 'gray'
            }
        },
        AssetPosition:
        {
            shape: 'icon',
            icon:
            {
                face: 'Glyphicons Halflings',
                code: '\ue022',
                size: 25,
                color: 'green'
            }
        },
        EnterpriseSubscription:
        {
            shape: 'icon',
            icon:
            {
                face: 'Glyphicons Halflings',
                code: '\ue148',
                size: 25,
                color: '#1964bc'
            }
        },
        Tenant:
        {
            shape: 'icon',
            icon:
            {
                face: 'Glyphicons Halflings',
                code: '\ue008',
                size: 25,
                color: '#330499'
            }
        }
    }

    static defaultGraphOptions: vis.Options =
    {
        nodes:
        {
            shape: Settings.defaultShapes[0]
        },
        edges:
        {
            arrows:
            {
                to:
                {
                    enabled: true,
                    scaleFactor: 0.45
                },
                from: false
            },
            smooth:
            {
                enabled: true,
                type: 'continuous',
                roundness: 0.5
            }
        },
        interaction:
        {
            hover: true,
            hoverConnectedEdges: true
        },
        layout:
        {
            improvedLayout: false
        }
    }
}