jQuery(function($){
  module("poller");

  test("$.fluxxPoller()", function(){
    var poller = $.fluxxPoller();
    var interfaceElements = _.reduce(
      ['start', 'stop', 'state', 'id'],
      0,
      function (i, m) { return !_.isUndefined(poller[m]) ? ++i : i}
    );
    equals(interfaceElements, 4, 'Has expected interface elements.');
    
    var poller2 = $.fluxxPoller();
    ok(poller.id != poller2.id, "Unique poller IDs");
    
    equals(poller.stateText(), 'off', 'poller is off');
    poller.start();
    equals(poller.stateText(), 'on', 'poller is on');
    poller.stop();
    equals(poller.stateText(), 'off', 'poller is off');    
  });
  
  test("Client-Side Polling Implementation", function(){
    var poller = $.fluxxPoller({
      implementation: 'polling',
      url: '/rtu_polling',
    });
    equals(poller.implementation, 'polling', 'Using polling');
    equals(poller.url, '/rtu_polling', 'Endpoint configured correctly');

    var interfaceElements = _.reduce(
      ['_intervalID', '_start', '_stop'],
      0,
      function (i, m) { return !_.isUndefined(poller[m]) ? ++i : i}
    );
    equals(interfaceElements, 3, 'Has expected interface elements.');

  });
});
