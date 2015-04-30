`import Ember from 'ember'`

NativeObject = Ember.Mixin.create(
	toNative: ->
		properties = []
		for key of @
			if jQuery.inArray(Ember.typeOf(@[key]), ['string', 'number', 'boolean']) != -1
				properties.push(key)
			return @getProperties(properties)
)

`export default NativeObject`
