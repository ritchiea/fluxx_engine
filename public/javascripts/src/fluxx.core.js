(function($){
  _.templateSettings = {
    start       : '{{',
    end         : '}}',
    interpolate : /\{\{(.+?)\}\}/g
  };

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
    },
    intersectProperties: function (one, two) {
      if (_.isEqual(one, two)) return one;
      var intersect = {};
      _.each(one, function (val, key) {
        if (val == two[key]) intersect[key] = val;
      });
      return intersect;
    },
    objectWithoutEmpty: function (object, without) {
      if (typeof without == 'undefined')
        without = [];
      if ($.isArray(object)) {
        var filled = [];
        _.each(object, function(item) {
          if ((item['name'] == 'q[q]' || !_.isEmpty(item['value'])) && without.indexOf(item['name']) == -1)
            filled.push(item);
        });
      } else if ($.isPlainObject(object)) {
        var filled = {};
        _.each(_.keys(object), function(key) {
          if (key == 'q' || !_.isEmpty(object[key])) {
            filled[key] = object[key];
          }
        });
      } else
        return object;
      return filled;
    },
    arrayToObject: function (list, filter) {
      var object = {};
      /* Cheap deep clone. */
      _.each(list, function(entry) {
        var entry = filter(_.clone(entry));
        object[entry.name] = entry.value;
      });
      return object;
    },
    isFilterMatch: function (filter, test) {
      $.fluxx.log('--- isFilterMatch ---', filter, test);
      
      var keys = _.intersect(_.keys(filter), _.keys(test));
      _.each([filter, test], function(obj) {
        _.each(_.keys(obj), function(key) {
          if (! _.detect(keys, function(i){return _.isEqual(key,i)})) {
            delete obj[key];
          }
        });
      });
      _.each(_.keys(filter), function(key) {
        if (_.isEmpty(filter[key])) {
          delete filter[key];
          delete test[key];
        };
      });
      $.fluxx.log('--- Cleanded Filter and Test ---', filter, test);

      var result = _.isEqual(
        (_.compose(_.size, _.intersectProperties))(filter, test),
        (_.compose(_.size, _.values))(filter)
      );
      $.fluxx.log('--- isFilterMatch ---');
      return result;
    }
  });
  
  $.extend(true, {
    my: {
      cards: $()
    },
    fluxx: {
      config: {
        cards: $('.card'),
        realtime_updates: {
          enabled: false,
          options: {
            url: null
          }
        }
      },
      cache: {},
      realtime_updates: null,
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
          if (_.isNull(value))     return '';
          if (_.isString(value))   return value;
          if ($.isArray(value))    return _.map(value,function(x){return $.fluxx.util.resultOf(x)}).join('');
          if ($.isFunction(value)) return arguments.callee(value.apply(value, _.tail(arguments)));
          if (_.isString(value.jquery))
            return $.fluxx.util.getSource(value);
          return value;
        },
        iconImage: function(name) {
          return $.fluxx.config.icon_path + '/' + name + '.png';
        },
        marginHeight: function($selector) {
          return parseInt($selector.css('marginTop')) + parseInt($selector.css('marginBottom'));
        },
        marginWidth: function($selector) {
          return ($selector.outerWidth(true) - $selected.width()) / 2;
        },
        itEndsWithMe: function(e) {
          e.stopPropagation();
          e.preventDefault();
        },
        itEndsHere: function (e) {
          e.stopImmediatePropagation();
          e.preventDefault();
        },
        getSource: function (sel) {
          return _.map($(sel), function(i) { return $('<div>').html($(i).clone()).html();});
        },
        getTag: function (sel) {
          return _.map($(sel), function(i){return $('<div>').html($(i).clone().empty().html('...')).html()}).join(', ')
        },
        autoGrowTextArea: function(sel) {
          var options = {
            minSize: 5
          };
          options.update = function (e) {
            var $ta = $(e.target);
            var lineHeight = parseInt($ta.css('lineHeight'));
            var newHeight = lineHeight * ($ta.val().split(/\n/).length + 1);
            if (newHeight < options.minSize * lineHeight) {
              newHeight = options.minSize * lineHeight;
            }
            $ta.height(newHeight);
          };
          sel.bind('change keydown', options.update).change();
        },
        seconds: function (i) { return i * 1000; },
        minutes: function (i) { return i * 60 * 1000; }
      },
      logOn: true,
      log: function () {
        if (!$.fluxx.logOn) return;
        if (typeof console == 'undefined') {
          $.fluxx.logOn = false;
        } else {
          if (! this.logger) this.logger = (console.log ? _.bind(console.log, console) : $.noop);
          _.each(arguments, _.bind(function(a) { this.logger(a) }, this));
        }
      },
      sessionData: function(key, value) {
        if (window.sessionStorage)
          if (value) 
            window.sessionStorage[key] = value;
          else if (key)
            return window.sessionStorage[key];
      }
    }
  });

  $('html').ajaxComplete(function(e, xhr, options) {
    if ($.cookie('user_credentials'))
      $.fluxx.sessionData('user_credentials', $.cookie('user_credentials')); 
    // Look for a HTTP response header called fluxx_template. If it has a value of login we are not logged in.
    if (xhr.getResponseHeader('fluxx_template') == 'login')
      window.location.href = window.location.href;
  }).ajaxSend(function(e, xhr, options) {
    if (!$.cookie('user_credentials')) {
      if ($.fluxx.sessionData('user_credentials')) {
        $.fluxx.log("user_credentials cookie set from local session store");
        $.cookie('user_credentials', $.fluxx.sessionData('user_credentials'));
        // Cookie has been lost so session will be lost
        // Use value stored in session store and do a synchronous ajax call to restore the cookie. 
        jQuery.ajax({
          url: window.location.href,
          async:   false,
          success: function() {
            $.noop;
          }
        });
        return false;
      }
    }
  });
  
  
  var keyboardShortcuts = {
    'Space+u': ['Force update', function() {
      var rtu = $.fluxx.realtime_updates;
      if (!rtu) return;
      $.fluxx.log('polling');
      rtu.poll();
    }],
    'Space+m': ['Show $.my cache', function() {
      $.fluxx.log('--- $.my CACHE BEGIN ---');
      _.each($.my, function(val,key) {
        $.fluxx.log(
          key +
          ' [' +
          val.length +
          ']: [' +
          $.fluxx.util.getTag(val) +
          ']'
        );
      });
      $.fluxx.log('--- $.my CACHE END ---');
    }],
    'Space+h': ['This help message', function() {
      $.fluxx.log.apply($.fluxx.log, _.map(keyboardShortcuts, function(v,k){return [k, v[0]].join(': ')}))
    }],
    'Space+c': ['Close all cards', function() {
      $.my.cards.removeFluxxCard();
    }],
    'p+s': ['start/stop polling', function () {
      var rtu = $.fluxx.realtime_updates;
      if (!rtu) return;
      if (rtu.state) {
        $.fluxx.log('stoping rtu');
        rtu.stop();
      } else {
        $.fluxx.log('starting rtu');
        rtu.start();
      }
    }]
  };
  
  $(document).shortkeys(_.extend.apply(_, _.map(keyboardShortcuts, function(v,k){var o={}; o[k] = v[1]; return o})));
})(jQuery);

jQuery(function($){
  $.my.body = $('body');
});