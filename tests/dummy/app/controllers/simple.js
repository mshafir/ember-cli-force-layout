import Ember from 'ember';

export default Ember.Controller.extend({
  listUpdate(lstName, val) {
    console.log('adding', lstName, val);
    this.get(lstName).pushObject(val);
  },
  listRemove(lstName, val) {
    console.log('removing ' ,lstName, val);
    if (val > -1) {
      this.get(lstName).removeAt(val);
    }
  },
  actions: {
    addedNode(node) {
      this.listUpdate('model.nodes', node);
    },
    removedNode(node) {
      this.listRemove('model.nodes', node);
    },
    addedLink(link) {
      this.listUpdate('model.links', link);
    },
    removedLink(link) {
      this.listRemove('model.links', link);
    }
  }
})
