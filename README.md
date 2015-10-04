# Ember-cli-d3-force-layout

An ember component for an interactive graph

## Usage
### Template

```
{{force-layout-graph
    charge={{!-- how much nodes repel/attract each other, default: -1000 --}}
    linkDistance={{!-- distance of links between nodes, default: 50 --}}
    gravity={{!-- tendency of nodes to move toward center, default: 0.1 --}}
    nodes={{!-- list of node objects (see below) --}}
    links={{!-- list of link objects (see below) --}}
    editable={{!-- whether the graph is in edit mode (allow creating new nodes and links) --}}
    addedNode={{!-- action fired when a new node gets added in edit mode --}}
    removedNode={{!-- action fired when a node is removed in edit mode --}}
    addedLink={{!-- action fired when a link is added in edit mode --}}
    removedLink={{!-- action fired when a link is removed in edit mode --}}
    selectedLink={{!-- action fired when a link is selected --}}
    selectedNode={{!-- action fired when a node is selected --}}
 }}
```

### Data
Nodes and Lists are specified as a lists (or ember array) of objects as follows:

```
this.set('nodes', [{ name: 'node1' }, { name: 'node2' }]);
this.set('links', [{ source: 'node1', target: 'node2', type: 'cool-link'}]);`
```

### Actions
The following is basic handling of node/link additions/removals

```
 // In your controller
 actions: {
   addedNode(node) {
     this.get('nodes'.pushObject(node);
   },
   addedLink(link) {
     this.get('links').pushObject(link);
   },
   removedNode(nodeIndex) {
     this.get('nodes').removeAt(nodeIndex);
   },
   removedLink(linkIndex) {
     this.get('links').removeAt(linkIndex);
   }
 }
```

## Collaborating

### Installation

* `git clone` this repository
* `npm install`
* `bower install`

### Running

* `ember server`
* Visit your app at http://localhost:4200.

### Running Tests

* `ember test`
* `ember test --server`

### Building

* `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
