import Ember from 'ember'
import layout from '../templates/components/force-layout-graph'

export default Ember.Component.extend({
  layout: layout,

  width: 960,
  height: 500,
  editable: true,

  selected_node: null,
  selected_link: null,
  mousedown_link: null,
  mousedown_node: null,
  mouseup_node: null,

  initializeProperties() {
    this._initialize('charge', -1000);
    this._initialize('linkDistance', 50);
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
    this._bindProperty('nodes', this.graphPropertyUpdate);
    this._bindProperty('links', this.graphPropertyUpdate);
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
      //this.set('links', this.get('links').filter((it) => it !== l));
    });
  },

  dataUpdate() {
    // calculate the node diff, while performing an update
    let retainKeys = {};
    for (let node of this.get('nodes')) {
      if (node.name) {
        if (!(node.name in this._nodeMap)) {
          let newNode = {name: node.name};
          this._nodeMap[node.name] = newNode;
          this._nodeList.push(newNode);
        }
        this.updateNode(this._nodeMap[node.name], node);
        retainKeys[node.name] = true;
      }
    }
    // delete non-retained nodes
    for (let nodeName in this._nodeMap) {
      if (!(nodeName in retainKeys)) {
        //this.spliceLinksForNode(node);
        this._nodeList = this._nodeList.filter((it) => it !== this._nodeMap[nodeName]);
        delete this._nodeMap[nodeName];
      }
    }
    // don't need to do edge diff (I think?)
    this._linkList = [];
    for (let edge of this.get('links')) {
      this._linkList.push({
        source: this._nodeMap[edge.source],
        target: this._nodeMap[edge.target],
        type: 'suit'
      });
    }
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
    this.dataUpdate();
    this.redraw();
  },

  setupGraph() {
    this.fill = d3.scale.category20();
    // init svg
    this.outer = d3.select(this.element)
      .append("svg:svg")
      .attr("width", this.get('width'))
      .attr("height", this.get('height'))
      .attr("pointer-events", "all");
    this.zoom = d3.behavior.zoom()
      .on("zoom", () => {
        this.rescale()
      });
    this.drag = d3.behavior.drag()
      .origin((d) => d)
      .on("dragstart", (d) => this.dragstart(d))
      .on("dragend", (d) => this.dragend(d));
    this.outer.append("defs").append("marker")
      .attr("id", "marker-"+this.elementId)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 13)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5");
    this.vis = this.outer
      .append('svg:g')
      .call(this.zoom)
      .on("dblclick.zoom", null)
      .append('svg:g')
      .on("mousemove", () => {
        this.mousemove();
      })
      .on("mouseup", () => {
        this.mouseup();
      });
    // Per-type markers, as they don't inherit styles.
    this.vis.append('svg:rect')
      .attr('width', this.get('width'))
      .attr('height', this.get('height'))
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
    this.texts = this.vis.append('g').selectAll(".graph-text");
    // add keyboard callback
    //d3.select(window)
    //	.on("keydown", this.keydown)
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

  mousemove() {
    if (!this.mousedown_node) {
      return;
    }
    if (this.get('editable')) {
      // update drag line
      this.drag_line
        .attr("x1", this.mousedown_node.x)
        .attr("y1", this.mousedown_node.y)
        .attr("x2", this.activeMouseX())
        .attr("y2", this.activeMouseY());
    } else {
      this.mousedown_node.x = this.activeMouseX();
      this.mousedown_node.y = this.activeMouseY();
      this.tick();
    }
  },

  id: 0,

  mouseup() {
    if (this.get('editable')) {
      if (this.mousedown_node) {
        // hide drag line
        this.drag_line
          .attr("class", "drag_line_hidden");
        if (!this.mouseup_node) {
          // add node
          let point = d3.mouse(this.get('element'));
          let node = {name: 'newnode'+this.id, text: 'new node '+this.id, x: point[0], y: point[1]};
          this.id++;
          this.sendAction('addedNode', node);
          // select new node
          this.selected_node = node;
          this.selected_link = null;
          this.sendAction('addedLink', {source: this.mousedown_node.name, target: node.name});
        }
      }
    }
  },

  resetMouseVars() {
    this.mousedown_node = null;
    this.mouseup_node = null;
    this.mousedown_link = null;
  },

  tick() {
    if (this.link && this.node) {
      //for node, i in this.data_nodes
      // this.get('nodes').objectAt(i).set('x', node.x)
      // this.get('nodes').objectAt(i).set('y', node.y)
      //this.set('links', this.wrapListNative(this.data_links))
      this.node
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y);

      this.link.attr('d', this.linkPath);
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

  dragstart(d) {
    // disable zoom
    d3.event.sourceEvent.stopPropagation();
    this.mousedown_node = d;
    if (this.mousedown_node == this.selected_node) {
      this.selected_node = null;
    } else {
      this.selected_node = this.mousedown_node;
    }
    this.selected_link = null;
    if (this.get('editable')) {
      // reposition drag line
      this.drag_line
        .attr("class", "link")
        .attr("x1", this.mousedown_node.x)
        .attr("y1", this.mousedown_node.y)
        .attr("x2", this.mousedown_node.x)
        .attr("y2", this.mousedown_node.y);
      this.redraw();
    }
  },

  dragend(d) {
    if (this.mousedown_node && this.mouseup_node) {
      if (this.mouseup_node == this.mousedown_node) {
        this.resetMouseVars();
        return;
      }
      if (this.get('editable')) {
        // add link
        let link = {source: this.mousedown_node.name, target: this.mouseup_node.name};
        this.sendAction('addedLink', link);
        // select new link
        //this.selected_link = link;
        this.selected_node = null;
      } else {
        this.force.start();
      }
      this.redraw();
    }
    this.resetMouseVars();
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
    this.link = this.link.data(this._linkList);
    this.link.enter().insert("svg:path")
      .attr("marker-end",  "url(." + window.location.pathname + "#marker-" + this.elementId + ")")
      .attr("class", function(d) { return "link"; })
      .on("mousedown", (d) => {
        this.mousedown_link = d;
        if (this.mousedown_link == this.selected_link) {
          this.selected_link = null;
        } else {
          this.selected_link = this.mousedown_link;
        }
        this.selected_node = null;
        this.redraw();
      });
    this.link.exit().remove();
    this.link.classed("link_selected", (d) => {
      return d == this.selected_link
    });
    this.nodedata = this.node.data(this._nodeList);
    this.nodeGroup = this.nodedata
      .enter()
      .append("g")
      .attr("class", "group");
    this.nodeGroup.append("circle")
      .attr("class", "node")
      .attr("r", 5)
      .call(this.drag)
      .on('mouseup', (d) => {
        this.mouseup_node = d
      })
      .transition()
      .duration(750)
      .ease("elastic")
      .attr("r", 6.5);
    this.vis.selectAll('.node')
      .classed("node_selected", (d) => { return d == this.selected_node; });
    this.textdata = this.texts.data(this._nodeList);
    this.textGroup = this.textdata
      .enter()
      .append("g")
      .attr("class", "group");
    this.textGroup.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .attr('class', 'graph-text')
      .text((d) => d.text);
    this.textdata.exit().transition()
      .style("opacity", 0)
      .remove();
    // prevent browser's default behavior
    if (d3.event && d3.event.preventDefault) {
      d3.event.preventDefault();
      d3.event.returnValue = false;
    }
    this.force.start();
  },

  keydown() {
    if (!this.selected_node && !this.selected_link) {
      return;
    }
    let key = d3.event.keyCode;
    if (key == 8 || key == 46) { // backspace or delete
      if (this.selected_node) {
        this.get('nodes').removeObject(this.selected_node);
        this.spliceLinksForNode(this.selected_node);
      } else if (this.selected_link) {
        this.get('links').removeObject(this.selected_link);
      }
      this.selected_link = null;
      this.selected_node = null;
      this.redraw();
    }
  }
});
