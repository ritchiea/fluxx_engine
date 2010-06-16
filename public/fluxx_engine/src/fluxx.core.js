(function($){
  window.$my = {};
  $.extend({
    fluxx: {
      util: {
        options_with_callback: function(defaults, options, callback) {
          if ($.isFunction(options)) {
            options = {callback: options};
          } else if ($.isPlainObject(options) && $.isFunction(callback)) {
            options['callback'] = callback;
          }
          return $.extend(defaults || {callback: $.noop}, options || {});
        }
      }
    }
  });
})(jQuery);
