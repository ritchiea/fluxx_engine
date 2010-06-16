(function($){
  $.fn.extend({
    fluxxStage: function(options, onComplete) {
      var options = $.fluxx.options_with_callback(
        {},        // Defaults
        options,   // Supplied Options
        onComplete // Supplied Callback
      )
      if ($.isFunction(options)) {
        options = {onComplete: options};
      } else if ($.isPlainObject(options) && $.isFunction(onComplete)) {
        options['onComplete'] = onComplete;
      } else if (! options){
        options = {};
      }
      var options = $.extend(defaults, options);
      return this.each(function(){
        $my['fluxx']  = $(this);
        $my['stage'] = $.fluxx.stage.ui.call(this).bind('onComplete', options.onComplete);
        $my.fluxx.html($my.stage);
        $my.stage.trigger('onComplete');
      });
    }
  });
  
  $.extend(true, {
    fluxx: {
      stage: {
        attrs: {
          id: 'stage'
        },
        ui: function() {
          return $('<div>')
            .attr($.fluxx.stage.attrs)
            .html([
              $.fluxx.stage.ui.header,
              $.fluxx.stage.ui.cardTable,
              $.fluxx.stage.ui.footer
            ].join(''));
        }
      }
    }
  });
  $.fluxx.stage.ui.header = [
    '<div id="header">',
      '<div id="logo"><a href=".">FLUXX</a></div>',
      '<ul class="actions">',
      '</ul>',
    '</div>'
  ].join('');
  $.fluxx.stage.ui.cardTable = [
    '<div id="card-table">',
      '<ul id="hand">',
      '</ul>',
    '</div>'
  ].join('');
  $.fluxx.stage.ui.footer = [
    '<div id="footer"></div>'
  ].join('');
})(jQuery);
