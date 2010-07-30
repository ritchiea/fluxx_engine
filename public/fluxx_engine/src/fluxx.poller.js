(function($){

  var STATES = [ 'off', 'on' ],
      S_OFF  = 0,
      S_ON   = 1;
  
  function Poller(options) {
    var options = $.fluxx.util.options_with_callback($.fluxx.poller.defaults,options);
    options.id  = options.id();
    $.extend(this, $.fluxx.implementations[options.implementation]);
    $.extend(this, options);
    $.fluxx.pollers.push(this);
    this.$ = $(this);
    this.subscribe(this.update);
    this._init();
  }
  $.extend(Poller.prototype, {
    stateText: function () {
      return STATES[this.state];
    },
    start: function () {
      this.state = S_ON;
      this._start();
      /*$(window)
        .focusin(this.start)
        .focusout(this.stop);*/
      this.$.trigger('start.fluxx.poller');
    },
    stop: function () {
      this.state = S_OFF;
      this._stop();
      /*$(window)
        .unbind('focusin', this.start)
        .unbind('focusout', this.stop);*/
    },
    message: function (data, status) {
      ('update.fluxx.poller')
      this.$.trigger('update.fluxx.poller', data, status);
    },
    subscribe: function (fn) {
      this.$.bind('update.fluxx.poller', fn);
    },
    destroy: function () {
      $.fluxx.pollers = _.without($.fluxx.pollers, this);
      delete this;
    }
  });
  
  $.extend({
    fluxxPoller: function(options) {
      return new Poller(options);
    },
    fluxxPollers: function() {
      return $.fluxx.pollers;
    },
    destroyFluxxPollers: function () {
      _.each($.fluxx.pollers, function (poller) {
        poller.destroy();
      });
    }
  });
  
  $.extend(true, {
    fluxx: {
      pollers: [],
      poller: {
        defaults: {
          implementation: 'polling',
          state: S_OFF,
          update: $.noop,
          id: function(){ return _.uniqueId('fluxx-poller-'); }
        }
      },
      implementations: {
        polling: {
          interval: $.fluxx.util.seconds(5),
          last_id: null,
          decay: 1.2, /* not used presently */
          maxInterval: $.fluxx.util.minutes(60),
          
          _timeoutID: null,
          _init: function () {
            _.bindAll(this, 'start', 'stop', '_poll');
            this.last_id = $.cookie('last_id');
          },
          _poll: function () {
            if (this.state == S_OFF) return;
            var doPoll = _.bind(function(){
              $.getJSON(this.url, {last_id: this.last_id}, _.bind(function(data, status){
                this.last_id = data.last_id;
                $.cookie('last_id', this.last_id);
                this.message(data, status);
                this._poll();
              }, this));
            }, this);
            this._timeoutID = setTimeout(doPoll, this.interval);
          },
          _start: function () {
            this.$
              .unbind('start.fluxx.poller.polling')
              .bind('start.fluxx.poller.polling', _.bind(this._poll, this))
          },
          _stop: function () {
            clearTimeout(this._timeoutID);
          }
        }
      }
    }
  });

})(jQuery);
