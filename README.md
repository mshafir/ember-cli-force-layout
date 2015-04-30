# ember-cli-d3-force-layout

This is a component wrapping some of the functionality of D3 Force Layouts in
a convenient package. 

See the example: http://mshafir.github.io/ember-cli-force-layout/simple
It's based on http://bl.ocks.org/benzguo/4370043, but with an upgrade for handling changes to zoom and drag logic in D3 v3.

Use as follows:

```
{{force-layout-graph 
 	charge=charge 
 	linkDistance=linkDistance 
 	gravity=gravity 
 	friction=friction 
 	editable=editable 
 	nodes=nodes}}
 ```

Default Styling necessary for the graph is up to you, but the following is a basic sample

```
.node {
  fill: #000;
  cursor: crosshair;
}

.node_selected {
  fill: #ff7f0e;
  stroke: #ff7f0e;
}

.drag_line {
  stroke: #999;
  stroke-width: 5;
  pointer-events: none;
}

.drag_line_hidden {
  stroke: #999;
  stroke-width: 0;
  pointer-events: none;
}

.link {
  stroke: #999;
  stroke-width: 5;
  cursor: crosshair;
}

.link_selected {
  stroke: #ff7f0e;
}
```


## Installation

* `ember install ember-cli-d3-force-layout`
