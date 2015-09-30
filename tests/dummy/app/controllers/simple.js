import Ember from 'ember';

export default Ember.Controller.extend({
  listUpdate(lstName, val) {
    this.set(lstName, this.get(lstName).concat([val]))
  },
  actions: {
    addedNode(node) {
      this.listUpdate('model.nodes', node);
    },
    addedLink(link) {
      this.listUpdate('model.links', link);
    }
  }
})
