import Ember from 'ember'
import layout from '../templates/components/force-layout-graph'

const {computed} = Ember;

export default Ember.Component.extend({
  layout: layout,

  width: 960,
  height: 500,
  editable: true,
  dragging: false,
  linkLabels: true,

  selectedNode: null,
  selectedLink: null,
  mousedown_link: null,
  mousedownNode: null,
  mouseupNode: null,

  initializeProperties() {
    this._initialize('charge', -1000);
    this._initialize('linkDistance', 50);
    this._initialize('linkLabels', true)
    this._initialize('gravity', null);
    this._initialize('friction', null);
    this._initialize('editable', true);
    this._initialize('nodes', []);
    this._initialize('links', []);
    this._nodeMap = {};
    this._nodeList = [];
    this._linkList = [];
  },

  bindProperties() {
    this._bindProperty('charge', this.forcePropertyUpdate);
    this._bindProperty('linkDistance', this.forcePropertyUpdate);
    this._bindProperty('gravity', this.forcePropertyUpdate);
    this._bindProperty('friction', this.forcePropertyUpdate);
    this._bindProperty('linkLabels', this.forcePropertyUpdate);
    this._bindProperty('nodes.@each', this.graphPropertyUpdate);
    this._bindProperty('links.@each', this.graphPropertyUpdate);
  },

  /**
   * Bind an observer on `key`, to be torn down in `willDestroyElement`.
   *
   * @private
   * @method _bindProperty
   */
  _bindProperty(key, method) {
    this.addObserver(key, this, method);
    this.on('willDestroyElement', this, function() {
      this.removeObserver(key, this, method);
    });
  },

  _initialize(key, value) {
    if (!this.get(key)) {
      this.set(key, value);
    }
  },

  didInsertElement() {
    this.initializeProperties();
    this.bindProperties();
    this.dataUpdate();
    this.setupGraph();
  },

  updateNodeProperty(node, propertyName, property) {
    if ((!(propertyName in node)) && property) {
      node[propertyName] = property;
    }
  },

  updateNode(node, data) {
    node['name'] = data.name;
    node['text'] = data.text ? data.text : data.name;
    this.updateNodeProperty(node, 'x', data.x);
    this.updateNodeProperty(node, 'y', data.y);
  },

  spliceLinksForNode(node) {
    this.toSplice = this.get('links').filter((l) => {
      return (l.source == node) || (l.target == node);
    });
    this.toSplice.map((l) => {
      this.sendAction('removedLink', this.get('links').indexOf(l));
    });
  },

  dataUpdate() {
    // calculate the node diff, while performing an update
    let retainKeys = {};
    let ind = 0;
    for (let node of this.get('nodes')) {
      if (node.name) {
        if (!(node.name in this._nodeMap)) {
          let newNode = { name: node.name, originalIndex: ind };
          this._nodeMap[node.name] = newNode;
          this._nodeList.push(newNode);
        }
        this.updateNode(this._nodeMap[node.name], node);
        retainKeys[node.name] = true;
      }
      ind++;
    }
    // rebuild the retained
    let newList = [];
    for (let nodeName in this._nodeMap) {
      if (!(nodeName in retainKeys)) {
        // this.spliceLinksForNode(node);
        let theNode = this._nodeMap[nodeName];
        delete this._nodeMap[nodeName];
      } else {
        newList.push(this._nodeMap[nodeName]);
      }
    }
    this._nodeList = newList;
    // don't need to do edge diff (I think?)
    this._linkList = [];
    let idx = 0;
    for (let edge of this.get('links')) {
      if (edge.source in this._nodeMap && edge.target in this._nodeMap) {
        this._linkList.push({
          source: this._nodeMap[edge.source],
          target: this._nodeMap[edge.target],
          type: edge.type
        });
      } else {
        this.sendAction('removedLink', idx);
      }
      idx++;
    }
    console.log(this._nodeList);
  },

  clearList() {
    this._nodeList = [];
    this.redraw();
  },

  setForceProperties() {
    this.force.charge(this.get('charge'));
    this.force.linkDistance(this.get('linkDistance'));
    if (this.get('friction')) {
      this.force.friction(this.get('friction'));
    }
    if (this.get('gravity')) {
      this.force.gravity(this.get('gravity'));
    }
  },

  forcePropertyUpdate() {
    this.setForceProperties();
    this.redraw();
  },

  graphPropertyUpdate() {
    console.log('data update');
    this.dataUpdate();
    this.redraw();
  },

  setupGraph() {
    this.fill = d3.scale.category20();
    // init svg
    this.outer = d3.select('#graph-'+this.elementId)
      .append("svg:svg")
      .attr("width", this.get('width'))
      .attr("height", this.get('height'))
      .attr("pointer-events", "all");
    this.zoom = d3.behavior.zoom()
      .on("zoom", () => {
        this.rescale()
      });
    this.outer.append("defs").append("marker")
      .attr("id", "marker-"+this.elementId)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 14)
      .attr("refY", -1)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5");
    this.vis = this.outer
      .append('svg:g')
      .call(this.zoom)
      .on("dblclick.zoom", null)
      .append('svg:g')
      .on("mousemove", () => {
        this.stageMousemove();
      })
      .on("mouseup", () => {
        this.stageMouseup();
      });
    // Per-type markers, as they don't inherit styles.
    this.vis.append('svg:rect')
      .attr('x', -this.get('width')*50)
      .attr('y', -this.get('height')*50)
      .attr('width', this.get('width')*100)
      .attr('height', this.get('height')*100)
      .attr('fill', 'white');
    // init force layout
    this.force = d3.layout.force()
      .size([this.get('width'), this.get('height')])
      .nodes(this._nodeList)
      .links(this._linkList)
      .on("tick", () => {
        this.tick()
      });
    this.setForceProperties();
    // line displayed when dragging new nodes
    this.drag_line = this.vis.append('g').append("line")
      .attr("class", "drag_line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0);
    this.link = this.vis.append('g').selectAll(".link");
    this.node = this.vis.append('g').selectAll(".node");
    this.texts = this.vis.append('g').selectAll(".graph-node-text");
    this.linkText = this.vis.append('g').selectAll(".graph-link-text");
    // add keyboard callback
    // d3.select(window)
    //  	.on("keydown", this.keydown);
    this.redraw();
  },

  activeMouse(id) {
    if (this.trans && this.scale) {
      return (d3.mouse(this.element)[id] - this.trans[id]) / this.scale;
    } else {
      return d3.mouse(this.element)[id];
    }
  },

  activeMouseX() {
    return this.activeMouse(0)
  },

  activeMouseY() {
    return this.activeMouse(1)
  },

  stageMousemove() {
    if (!this.mousedownNode) {
      return;
    }
    if (this.get('adding')) {
      // update drag line
      this.drag_line
        .attr("x1", this.mousedownNode.x)
        .attr("y1", this.mousedownNode.y)
        .attr("x2", this.activeMouseX())
        .attr("y2", this.activeMouseY());
    } else {
      this.mousedownNode.x = this.activeMouseX();
      this.mousedownNode.y = this.activeMouseY();
      this.tick();
    }
  },

  id: 0,

  stageMouseup() {
    if (this.get('adding')) {
      if (this.mousedownNode) {
        // hide drag line
        this.drag_line
          .attr("class", "drag_line_hidden");
        if (!this.mouseupNode) {
          // add node
          let point = d3.mouse(this.get('element'));
          let node = {name: 'newnode'+this.id, text: 'new node '+this.id, x: point[0], y: point[1]};
          this.id++;
          this.sendAction('addedNode', node);
          // select new node
          this.set('selectedNode',node);
          this.set('selectedLink',null);
          this.sendAction('addedLink', {source: this.mousedownNode.name, target: node.name});
        }
      }
    } else if (this.get('removing') && this.mouseupNode) {
      this.sendAction('removedNode', this._nodeList.indexOf(this.mouseupNode));
      this.clearList();
      this.graphPropertyUpdate();
    }
    this.resetMouseVars();
  },

  resetMouseVars() {
    this.mousedownNode = null;
    this.mouseupNode = null;
    this.mousedown_link = null;
    this.set('dragging', false);
  },

  avg(a, b) {
    return (a + b) / 2;
  },

  signDiff(a,b) {
    return (a > b) ? 1 : -1;
  },

  tick() {
    if (this.link && this.node) {
      this.node
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y);
      this.link.attr('d', this.linkPath);
      this.linkText
        .attr('x', (d) => this.avg(d.source.x, d.target.x) + this.signDiff(d.source.x, d.target.x)*10)
        .attr('y', (d) => this.avg(d.source.y, d.target.y) + this.signDiff(d.source.x, d.target.x)*10);
      this.vis.selectAll('.group').attr("transform", (d, i) => {
        return "translate(" + d.x + "," + d.y + ")";
      });
    }
  },

  linkPath(d) {
    let dx = d.target.x - d.source.x;
    let dy = d.target.y - d.source.y;
    let dr = Math.sqrt(dx * dx + dy * dy);
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    //return "M" + d.source.x + "," + d.source.y + " " + d.target.x + "," + d.target.y;
  },

  mousedown(d) {
    d3.event.stopPropagation();
    // disable zoom
    //d3.event.sourceEvent.stopPropagation();
    this.mousedownNode = d;
    if (this.mousedownNode == this.selectedNode) {
      this.selectedNode = null;
    } else {
      this.selectedNode = this.mousedownNode;
    }
    this.selectedLink = null;
    if (this.get('adding')) {
      this.set('dragging', true);
      // reposition drag line
      this.drag_line
        .attr("class", "link")
        .attr("x1", this.mousedownNode.x)
        .attr("y1", this.mousedownNode.y)
        .attr("x2", this.mousedownNode.x)
        .attr("y2", this.mousedownNode.y);
      this.redraw();
    }
  },

  mouseup(d) {
    if (this.mousedownNode && this.mouseupNode) {
      if (this.mouseupNode == this.mousedownNode) {
        return;
      }
      if (this.get('adding')) {
        // add link
        let link = {source: this.mousedownNode.name, target: this.mouseupNode.name};
        this.sendAction('addedLink', link);
        // select new link
        //this.selectedLink = link;
        this.selectedNode = null;
      } else {
        this.force.start();
      }
    }
  },

  // rescale g
  rescale() {
    this.trans = d3.event.translate;
    this.scale = d3.event.scale;
    this.vis.attr("transform",
      "translate(" + this.trans + ")" + " scale(" + this.scale + ")");
  },

  // redraw force layout
  redraw() {
    // handling links
    this.link = this.link.data(this._linkList);
    this.link.enter().append("svg:path")
      .attr("marker-end",  "url(." + window.location.pathname + "#marker-" + this.elementId + ")")
      .attr("class", function(d) { return "link"; })
      .on("mousedown", (d,i) => {
        this.mousedown_link = d;
        if (this.get('removing')) {
          this.sendAction("removedLink", i);
        } else if (!this.get('editable')) {
          if (this.mousedown_link == this.selectedLink) {
            this.selectedLink = null;
          } else {
            this.selectedLink = this.mousedown_link;
            this.sendAction("selectedLink", d);
          }
        }
        this.selectedNode = null;
        this.redraw();
      });
    this.link.exit().transition().style('opacity', 0).remove();
    this.link.classed("link_selected", (d) => {
      return d == this.selectedLink
    });

    // handling link text
    this.linkText = this.linkText.data(this._linkList);
    this.linkText.enter().append('text')
      .attr('class', '.graph-link-text')
      .text((d) => d.type);
    this.linkText
      .attr('class', () => {
        let classes = '';
        if (!this.get('linkLabels')) {
          classes += 'hide-link';
        }
        return classes + ' graph-link-text';
      });
    this.linkText.exit().transition().style('opacity', 0).remove();

    // handling nodes
    this.node = this.node.data(this._nodeList);
    this.nodeGroup = this.node.enter();
    this.nodeGroup.append('circle')
      .attr("class", "node group")
      .attr("r", 5)
      .on('mouseup', (d, i) => {
        let node = this._nodeList[d.originalIndex];
        this.mouseupNode = d;
        if (this.mousedownNode === this.mouseupNode) {
          this.selectedNode = d;
          this.sendAction("selectedNode", d, i);
          this.redraw();
        }
        this.mouseup(d);
      })
      .on('mousedown', (d) => {
        this.mousedown(d);
      })
      .transition()
      .duration(750)
      .ease("elastic")
      .attr("r", 6.5);
    this.node.exit().transition()
      .style("opacity", 0)
      .remove();

    // handling texts
    this.vis.selectAll('.node')
      .classed("node_selected", (d) => { return d == this.selectedNode; });
    this.texts = this.texts.data(this._nodeList);
    this.textGroup = this.texts.enter();
    this.textGroup.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .attr('class', 'graph-node-text group')
      .text((d) => d.text);
    this.texts.exit().transition()
      .style("opacity", 0)
      .remove();
    // prevent browser's default behavior
    if (d3.event && d3.event.preventDefault) {
      d3.event.preventDefault();
    }
    this.force.start();
  },

  /*
  keydown() {
    if (!this.selectedNode && !this.selectedLink) {
      return;
    }
    let key = d3.event.keyCode;
    if (key == 8 || key == 46) { // backspace or delete
      if (this.selectedNode) {
        this.sendAction("removedNode", this.selectedNode);
        this.spliceLinksForNode(this.selectedNode);
      } else if (this.selectedLink) {
        this.sendAction("removedLink", this.selectedLink);
      }
      this.selectedLink = null;
      this.selectedNode = null;
      this.redraw();
    }
  },
  */

  adding: computed('mode', 'editable', function() {
    return this.get('editable') && this.get('mode') == 'add';
  }),

  removing: computed('mode', 'editable', function() {
    return this.get('editable') && this.get('mode') == 'remove';
  }),

  actions: {
    setAdd() {
      this.set('mode', 'add');
    },
    setRemove() {
      this.set('mode', 'remove');
    }
  }
});
