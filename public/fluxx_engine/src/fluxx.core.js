(function($){
  $.extend(true, {
    my: {}, /* Selector Cache */
    fluxx: {
      util: {
        options_with_callback: function(defaults, options, callback) {
          if ($.isFunction(options)) {
            options = {callback: options};
          } else if ($.isPlainObject(options) && $.isFunction(callback)) {
            options.callback = callback;
          }
          return $.extend({callback: $.noop}, defaults || {}, options || {});
        }
      }
    }
  });
})(jQuery);

jQuery(function($){
  $.my.body = $('body');
});