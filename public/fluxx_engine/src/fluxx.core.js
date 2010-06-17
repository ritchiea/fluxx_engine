(function($){
  $.extend(true, {
    my: {}, /* Selector Cache */
    fluxx: {
      config: {
        cards: []
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
          if ($.isArray(value))    return value.join('');
          if ($.isFunction(value)) return arguments.callee(value(_.tail(arguments)));
          return value;
        }
      }
    }
  });
})(jQuery);

jQuery(function($){
  $.my.body = $('body');
});