import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    return {
      width: 960,
      height: 500,
      charge: -1000,
      gravity: null,
      linkDistance: 50,
      nodes: Ember.A([
        {name: 'Microsoft'},
        {name: 'Samsung'},
        {name: 'Motorola'},
        {name: 'Nokia'},
        {name: 'Oracle'},
        {name: 'Apple'},
        {name: 'Qualcomm'},
        {name: 'Huawei'},
        {name: 'Ericsson'},
        {name: 'Kodak'},
        {name: 'HTC'},
        {name: 'Barnes & Noble'},
        {name: 'Foxconn'},
        {name: 'Google'},
        {name: 'Inventec'},
        {name: 'LG'},
        {name: 'RIM'},
        {name: 'ZTE'},
        {name: 'Sony'},
        {name: 'Amazon'}
      ]),
      links: Ember.A([
        {source: "Microsoft", target: "Amazon", type: "licensing"},
        {source: "Microsoft", target: "HTC", type: "licensing"},
        {source: "Samsung", target: "Apple", type: "suit"},
        {source: "Motorola", target: "Apple", type: "suit"},
        {source: "Nokia", target: "Apple", type: "resolved"},
        {source: "HTC", target: "Apple", type: "suit"},
        {source: "Kodak", target: "Apple", type: "suit"},
        {source: "Microsoft", target: "Barnes & Noble", type: "suit"},
        {source: "Microsoft", target: "Foxconn", type: "suit"},
        {source: "Oracle", target: "Google", type: "suit"},
        {source: "Apple", target: "HTC", type: "suit"},
        {source: "Microsoft", target: "Inventec", type: "suit"},
        {source: "Samsung", target: "Kodak", type: "resolved"},
        {source: "LG", target: "Kodak", type: "resolved"},
        {source: "RIM", target: "Kodak", type: "suit"},
        {source: "Sony", target: "LG", type: "suit"},
        {source: "Kodak", target: "LG", type: "resolved"},
        {source: "Apple", target: "Nokia", type: "resolved"},
        {source: "Qualcomm", target: "Nokia", type: "resolved"},
        {source: "Apple", target: "Motorola", type: "suit"},
        {source: "Microsoft", target: "Motorola", type: "suit"},
        {source: "Motorola", target: "Microsoft", type: "suit"},
        {source: "Huawei", target: "ZTE", type: "suit"},
        {source: "Ericsson", target: "ZTE", type: "suit"},
        {source: "Kodak", target: "Samsung", type: "resolved"},
        {source: "Apple", target: "Samsung", type: "suit"},
        {source: "Kodak", target: "RIM", type: "suit"},
        {source: "Nokia", target: "Qualcomm", type: "suit"}
      ])
    };
  }
});
