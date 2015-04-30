`import Ember from 'ember'`
`import layout from '../templates/components/force-layout-graph'`
`import NativeObject from '../mixins/native-object'`

ForceLayoutGraphComponent = Ember.Component.extend(
	layout: layout

	width: 960
	height: 500

	selected_node: null
	selected_link: null
	mousedown_link: null
	mousedown_node: null
	mouseup_node: null

	initializeProperties: ->
		@set('charge', -200)
		@set('linkDistance', 50)
		@set('gravity', null)
		@set('friction', null)
		@set('nodes', [])
		@set('links', [])
		@set('editable', true)

	didInsertElement: ->
		@initializeProperties()
		@setupGraph()

	nodeUpdate: (->
		if @node? and @link?
			console.log('updating node text')
			@get('nodes').forEach((node, i) =>
				if node.get?('text')
					@data_nodes[i].text = node.get('text'))
			@vis.selectAll('text').text((d) -> d.text)
			@redraw()
	).observes('nodes.@each.text')

	setForceProperties: ->
		@force.charge(@get('charge'))
				.linkDistance(@get('linkDistance'))
		if @get('friction')
			@force.friction(@get('friction'))
		if @get('gravity')
			@force.gravity(@get('gravity'))

	forcePropertyUpdate: (->
		if @force?
			@setForceProperties()
			@redraw()
	).observes('charge', 'linkDistance', 'gravity', 'friction')

	wrapNative: (obj) ->
		Ember.Object.extend(NativeObject,obj).create()

	wrapListNative: (list) ->
		Ember.A(@wrapNative(n) for n in list)

	setupGraph: ->
		@fill = d3.scale.category20()
		# init svg
		@outer = d3.select(@element)
			.append("svg:svg")
				.attr("width", @get('width'))
				.attr("height", @get('height'))
				.attr("pointer-events", "all")
		@zoom = d3.behavior.zoom()
			.on("zoom", => @rescale())
		@drag = d3.behavior.drag()
			.origin((d) -> d)
			.on("dragstart", (d) => @dragstart(d))
			.on("dragend", (d) => @dragend(d))
		@vis = @outer
			.append('svg:g')
				.call(@zoom)
				.on("dblclick.zoom", null)
			.append('svg:g')
				.on("mousemove", => @mousemove())
				.on("mouseup", => @mouseup())
		@vis.append('svg:rect')
			.attr('width', @get('width'))
			.attr('height', @get('height'))
			.attr('fill', 'white')
		# init force layout
		@force = d3.layout.force()
			.size([@get('width'), @get('height')])
			.nodes([{text: 'root'}])
			.on("tick", => @tick())
		@setForceProperties()
		# line displayed when dragging new nodes
		@drag_line = @vis.append("line")
			.attr("class", "drag_line")
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", 0)
			.attr("y2", 0)
		# get layout properties
		@data_nodes = @force.nodes()
		@data_links = @force.links()
		@node = @vis.selectAll(".node")
		@link = @vis.selectAll(".link")
		# add keyboard callback
		#d3.select(window)
		#	.on("keydown", @keydown)
		@redraw()

	activeMouse: (id) ->
		if @trans? and @scale?
			(d3.mouse(@element)[id] - @trans[id])/@scale
		else
			d3.mouse(@element)[id]

	activeMouseX: -> @activeMouse(0)
	activeMouseY: -> @activeMouse(1)

	mousemove: ->
		if (!@mousedown_node)
			return
		if @get('editable')
			# update drag line
			@drag_line
				.attr("x1", @mousedown_node.x)
				.attr("y1", @mousedown_node.y)
				.attr("x2", @activeMouseX())
				.attr("y2", @activeMouseY())
		else
			@mousedown_node.x = @activeMouseX()
			@mousedown_node.y = @activeMouseY()
			@tick()

	mouseup: ->
		if @get('editable')
			if (@mousedown_node)
				# hide drag line
				@drag_line
					.attr("class", "drag_line_hidden")
				if (!@mouseup_node)
					# add node
					point = d3.mouse(@get('element'))
					node ={text: 'new node', x: point[0], y: point[1]}
					@data_nodes.push(node)
					# select new node
					@selected_node = node
					@selected_link = null
					# add link to mousedown node
					@data_links.push({source: @mousedown_node, target: node})
				@redraw()

	resetMouseVars: ->
		@mousedown_node = null
		@mouseup_node = null
		@mousedown_link = null

	tick: ->
		if (@link && @node)
			if @get('nodes.length') != @data_nodes.length
				@set('nodes', @wrapListNative(@data_nodes))
			else
				for node, i in @data_nodes
					@get('nodes').objectAt(i).set('x', node.x)
					@get('nodes').objectAt(i).set('y', node.y)
			@set('links', @wrapListNative(@data_links))
			@link.attr("x1", (d) -> d.source.x )
				.attr("y1", (d) -> d.source.y )
				.attr("x2", (d) -> d.target.x )
				.attr("y2", (d) -> d.target.y )
			@vis.selectAll('.group').attr("transform", (d, i) -> "translate(" + d.x + "," + d.y + ")")

	dragstart: (d) ->
		# disable zoom
		d3.event.sourceEvent.stopPropagation()
		@mousedown_node = d
		if (@mousedown_node == @selected_node)
			@selected_node = null
		else
			@selected_node = @mousedown_node
		@selected_link = null
		if @get('editable')
			# reposition drag line
			@drag_line
				.attr("class", "link")
				.attr("x1", @mousedown_node.x)
				.attr("y1", @mousedown_node.y)
				.attr("x2", @mousedown_node.x)
				.attr("y2", @mousedown_node.y)
		@redraw()

	dragend: (d) ->
		if @mousedown_node? and @mouseup_node?
			if (@mouseup_node == @mousedown_node)
				@resetMouseVars()
				return
			if @get('editable')
				# add link
				link = {source: @mousedown_node, target: @mouseup_node}
				@data_links.pushObject(link)
				# select new link
				@selected_link = link
				@selected_node = null
			else
				@force.start()
			@redraw()
		@resetMouseVars()

	# rescale g
	rescale: ->
		@trans=d3.event.translate
		@scale=d3.event.scale
		@vis.attr("transform",
			"translate(" + @trans + ")" + " scale(" + @scale + ")")

	# redraw force layout
	redraw: ->
		@link = @link.data(@data_links)
		@link.enter().insert("line", ".group")
			.attr("class", "link")
			.on("mousedown",
				(d) =>
					@mousedown_link = d
					if (@mousedown_link == @selected_link)
						@selected_link = null
					else
						@selected_link = @mousedown_link
					@selected_node = null
					@redraw())
		@link.exit().remove()
		@link.classed("link_selected", (d) => return d == @selected_link )
		@nodedata = @vis
			.selectAll(".group").data(@data_nodes)
		@node = @nodedata
			.enter()
			.insert("g")
			.attr("class", "group")
		@node.append("circle")
			.attr("class", "node")
			.attr("r", 5)
			.call(@drag)
			.on('mouseup', (d) => @mouseup_node = d)
			.transition()
				.duration(750)
				.ease("elastic")
				.attr("r", 6.5)
		@node.append("text")
			.attr("dx", 12)
			.attr("dy", ".35em")
			.text((d) => d.text)
		@nodedata.exit().transition()
			.style("opacity", 0)
			.remove()
		@vis.selectAll('.node')
			.classed("node_selected", (d) => d == @selected_node )
		# prevent browser's default behavior
		d3.event?.preventDefault?()
		event?.returnValue = false
		@force.start()

	spliceLinksForNode: (node) =>
		@toSplice = @get('links').filter( (l) =>
			return (l.source == node) || (l.target == node))
		@toSplice.map( (l) =>
			@get('links').removeObject(l))

	keydown: ->
		if (!@selected_node && !@selected_link)
			return
		switch d3.event.keyCode
			when 8, 46 # backspace or delete
				if (@selected_node)
					@get('nodes').removeObject(@selected_node)
					@spliceLinksForNode(@selected_node)
				else if (@selected_link)
					@get('links').removeObject(@selected_link)
				@selected_link = null
				@selected_node = null
				@redraw()

)

`export default ForceLayoutGraphComponent`
