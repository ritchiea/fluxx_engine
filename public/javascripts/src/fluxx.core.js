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
        _.each(functions, function(f){
          try {
            f.apply(this_, args);
          } catch(e) {
            $.fluxx.log("**Error", e.stack);
          }
        });
      }
    },
    intersectProperties: function (one, two, hierarchies) {
      if (_.isEqual(one, two)) return one;
      var intersect = {};
      _.each(one, function (val, key) {
        if (!$.isArray(val))
          val = [val];
        _.each(val, function(single) {
          _.each($.isArray(two[key]) ? two[key] : [two[key]], function(twoVal) {
            if (hierarchies.indexOf(key) != -1) {
              var i = 0;
              twoVal = twoVal.split('-');
              _.each(single.split('-'), function(id) {
                if (!id)
                  twoVal[i] = '';
                i++;
              });
              twoVal = twoVal.join('-');
            }
            if (single == twoVal) intersect[key] = single;
          });
        });
      });
      return intersect;
    },
    objectWithoutEmpty: function (object, without) {
      if (typeof without == 'undefined')
        without = [];
      if ($.isArray(object)) {
        var filled = [];
        _.each(object, function(item) {
          if (item && (item['name'] == 'q[q]' || !_.isEmpty(item['value'])) && without.indexOf(item['name']) == -1)
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
        if (object[entry.name]) {
          if (!$.isArray(object[entry.name]))
            object[entry.name] =[ object[entry.name] ]
					if (object[entry.name].indexOf(entry.value) == -1)
          	object[entry.name].push(entry.value);
        } else {
          object[entry.name] = entry.value;
        }
      });
      return object;
    },
    isFilterMatch: function (filter, test) {
      $.fluxx.log('--- isFilterMatch ---', filter, test);
      
      if(test == null) {
        return true;
      }

      var keys = _.intersect(_.keys(filter), _.keys(test));
      var hierarchies = (filter.hierarchies ? filter.hierarchies : []);
      _.each([filter, test], function(obj) {
        _.each(_.keys(obj), function(key) {
          if (! _.detect(keys, function(i){return _.isEqual(key,i);})) {
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
        (_.compose(_.size, _.intersectProperties))(filter, test, hierarchies),
        (_.compose(_.size, _.values))(filter)
      );
      $.fluxx.log('--- isFilterMatch ---');
      return result;
    },
    uniqueNumber: function() {
      if ( typeof _.uniqueNumber.counter == 'undefined' ) {
        _.uniqueNumber.counter = 0;
      }
      return _.uniqueNumber.counter++;
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
            minSize: 100
          };
          sel.height(options.minSize);
          options.update = function (e) {
            var $ta = $(e.target);
            if ($ta[0].offsetHeight < $ta[0].scrollHeight)
                $ta.height($ta[0].scrollHeight);
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
      setVal: function($elems, val) {
        $elems.each(function() {
          var $elem = $(this);
          if ($elem.is(':input'))
            $elem.val(val);
          else
            $elem.html(val);
          //TODO AML: {symbol: "$"}  - set the currency symbol
          if ($elem.hasClass('amount'))
            $elem.formatCurrency();
        });
      },
      sessionData: function(key, value) {
        if (window.sessionStorage)
          if (value)
            window.sessionStorage[key] = value;
          else if (key)
            return window.sessionStorage[key];
      },
      unparam: function(query) {
        var query_string = {};
        if (typeof query == "string") {
          var vars = query.split("&");
          for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            pair[0] = decodeURIComponent(pair[0]);
            pair[1] = decodeURIComponent(pair[1]);
                // If first entry with this name
            if (typeof query_string[pair[0]] === "undefined") {
              query_string[pair[0]] = pair[1];
                // If second entry with this name
            } else if (typeof query_string[pair[0]] === "string") {
              var arr = [ query_string[pair[0]], pair[1] ];
              query_string[pair[0]] = arr;
                // If third or later entry with this name
            } else {
              query_string[pair[0]].push(pair[1]);
            }
          }
        }
        return query_string;
      },
      unparamToArray: function(query) {
        var array = [];
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
          var pair = vars[i].split("=");
          pair[0] = decodeURIComponent(pair[0]);
          pair[1] = decodeURIComponent(pair[1]);
          array.push({name: pair[0], value: pair[1]});
        }
        return array;
      },
      cleanupRequest: function(req) {
        if (!req.url)
          return req;
        var query = req.url.split(/\?/);
        if (query.length > 1) {
          req.url = query.splice(0,1)[0];
          if (!$.isArray(req.data))
            req.data = []
          req.data = $.unique(req.data.concat($.fluxx.unparamToArray(query.join('&'))));
        }
        return req;
      },
      cleanupURL: function(url) {
        var req = {url: url, data: []};
        return $.fluxx.cleanupRequest(req).url;
      },
      scrollBarWidth: function() {
        document.body.style.overflow = 'hidden';
        var width = document.body.clientWidth;
        document.body.style.overflow = 'scroll';
        width -= document.body.clientWidth;
        if(!width) width = document.body.offsetWidth - document.body.clientWidth;
        document.body.style.overflow = '';
        return width;
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
			// Make all URLS local
  		options.url = options.url.replace(/^http\:\/\/[^/]+/, '');
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

  $.fn.charCount = function(options){
    // default configuration properties
    var defaults = {
      allowed: 140,
      warning: 25,
      css: 'counter',
      counterElement: 'span',
      cssWarning: 'limit_warning',
      cssExceeded: 'limit_exceeded',
      counterText: ''
    };

    var options = $.extend(defaults, options);

    function calculate(obj){
      var count = $(obj).val().length;
      var available = options.allowed - count;
      if(available <= options.warning && available >= 0){
        $(obj).next().addClass(options.cssWarning);
      } else {
        $(obj).next().removeClass(options.cssWarning);
      }
      if(available <= 0){
        $(obj).addClass(options.cssExceeded);
      } else {
        $(obj).removeClass(options.cssExceeded);
      }
      var $counter = $(obj).next();
      if (!$counter.hasClass('counter'))
        $counter = $counter.next();
      $counter.html(options.counterText + available);
    };

    this.each(function() {
      $(this).after('<'+ options.counterElement +' class="' + options.css + '">'+ options.counterText +'</'+ options.counterElement +'>');
      calculate(this);
      $(this).keyup(function(){calculate(this)});
      $(this).change(function(){calculate(this)});
      $(this).keydown(function(e) {
        if ($(this).hasClass('limit_exceeded') && e.which != 8 && e.which != 46) {
          e.preventDefault();
        }
      });
    });
  };

  $(document).shortkeys(_.extend.apply(_, _.map(keyboardShortcuts, function(v,k){var o={}; o[k] = v[1]; return o})));
  jQuery.fx.interval = 2;
})(jQuery);

jQuery(function($){
  $.my.body = $('body');
});