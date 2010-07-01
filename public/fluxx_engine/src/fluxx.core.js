(function($){
  _.mixin({
    addUp: function (set, property) {
      var args = _.toArray(arguments).slice(2);
      return _.reduce($(set), 0, function(m,i){
        return m + $(i)[property].apply($(i), args);
      });
    },
    callAll: function () {
      var functions = _.toArray(arguments);
      return function() {
        var this_ = this;
        var args  = arguments;
        _.each(functions, function(f){f.apply(this_, args)});
      }
    }
  });
  
  $.extend(true, {
    my: {
      cards: $()
    },
    fluxx: {
      config: {
        cards: $('.card')
      },
      util: {
        options_with_callback: function(defaults, options, callback) {
          if ($.isFunction(options)) {
            options = {callback: options};
          } else if ($.isPlainObject(options) && $.isFunction(callback)) {
            options.callback = callback;
          }
          return $.extend({callback: $.noop}, defaults || {}, options || {});
        },
        resultOf: function (value) {
          if (_.isString(value))   return value;
          if ($.isArray(value))    return _.map(value,function(x){return $.fluxx.util.resultOf(x)}).join('');
          if ($.isFunction(value)) return arguments.callee(value.apply(value, _.tail(arguments)));
          return value;
        },
        marginHeight: function($selector) {
          return parseInt($selector.css('marginTop')) + parseInt($selector.css('marginBottom'));
        },
        itEndsWithMe: function(e) {
          e.stopPropagation();
          e.preventDefault();
        },
        itEndsHere: function (e) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      },
      logOn: true,
      log: function () {
        if (!$.fluxx.logOn) return;
        if (! this.logger) this.logger = (console && console.log ? _.bind(console.log, console) : $.noop);
        _.each(arguments, _.bind(function(a) { this.logger(a) }, this));
      }
    }
  });
  
  $(document).shortkeys({
    'Space+m': function() {
      $.fluxx.log('--- $.my CACHE BEGIN ---');
      _.each($.my, function(val,key) {
        $.fluxx.log(
          key +
          ' [' +
          val.length +
          ']: [' +
          _.map(val, function(i){return $('<div>').html($(i).clone().empty().html('...')).html()}).join(', ') +
          ']'
        );
      });
      $.fluxx.log('--- $.my CACHE END ---');
    }
  })
})(jQuery);

jQuery(function($){
  $.my.body = $('body');
});


/*

Realtime Updates
================

lifecycle
---------
- subscribe
- connect
- ping
- disconnect
- unsubscribe

config
------
fluxx: {
  realtime_updates: {
    implementation: 'polling'
  },
  implementations: {
    polling: {
      config: {
        interval: 10 * 60 * 1000 // Ten Minutes
        endpoint: '/realtime_updates',
        url: function () {
          return $.fluxx.realtime_updates.endpoint
               + '?'
               + $.param({ last_id: $.cookie('realtime_updates_last_id') });
        }
      },
      subscribe: function (){},
      connect: function () {},
      ping: function () {},
      disconnect: function () {},
      unsubscribe: functino () {}
    },
    comet: {
      config: {
      },
      subscribe: function (){},
      connect: function () {},
      ping: function () {},
      disconnect: function () {},
      unsubscribe: functino () {}
    }
  }
}

polling
-------
Only poll when focused.

*/
