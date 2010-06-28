(function($){
  $.fn.extend({
    addFluxxDock: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback($.fluxx.dock.defaults,options,onComplete);
      return this.each(function(){
        var $dock = $.fluxx.dock.ui.call($.my.hand, options).hide()
          .appendTo($.my.hand);
      });
    }
  });
  $.extend(true, {
    fluxx: {
      dock: {
        defaults: {
        },
        attrs: {
          'class': 'dock'
        },
        ui: function(options) {
          return $('<div>')
            .attr($.fluxx.card.attrs)
            .html($.fluxx.util.resultOf([
              'Hello'
            ]));
        }
      }
    }
  });
  
  $(function($){
    $.fluxx.log("BINDING LIVE EVENT NOW");
    $('.card').live('load.fluxx.card', function(e){
      var $card = $(this);
      $.fluxx.log($card.attr('id'), e, 'card loaded');
    });
  });
})(jQuery);