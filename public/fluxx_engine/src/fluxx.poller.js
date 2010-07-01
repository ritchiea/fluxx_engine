(function($){

  var STATES = [ 'off', 'on' ],
      S_OFF  = 0,
      S_ON   = 1;
  
  function Poller(options) {
    var options = $.fluxx.util.options_with_callback($.fluxx.poller.defaults,options);
    options.id  = options.id();
    $.extend(this, options);
    $.extend(this, $.fluxx.implementations[this.implementation]);
    $.fluxx.pollers.push(this);
  }
  $.extend(Poller.prototype, {
    stateText: function () {
      return STATES[this.state];
    },
    start: function () {
      this.state = S_ON;
    },
    stop: function () {
      this.state = S_OFF;
    },
    message: function () {
      
    }
  });
  
  $.extend({
    fluxxPoller: function(options) {
      return new Poller(options);
    }
  });
  
  $.extend(true, {
    fluxx: {
      pollers: [],
      poller: {
        defaults: {
          implementation: 'polling',
          state: S_OFF,
          id: function(){ return _.uniqueId('fluxx-poller-'); }
        }
      },
      implementations: {
        polling: {
          _intervalID: null,
          _start: function () {},
          _stop: function () {}
        }
      }
    }
  });

})(jQuery);
