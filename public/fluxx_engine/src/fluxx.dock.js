(function($){
  $.fn.extend({
    addFluxxDock: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback($.fluxx.dock.defaults,options,onComplete);
      return this.each(function(){
        var $dock = $.fluxx.dock.ui.call($.my.hand, options)
          .appendTo($.my.footer);
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
    $('#stage').live('complete.fluxx.stage', function(e) {
      $.my.footer.addFluxxDock();
      $('.card').live('load.fluxx.card', function(e){
        var $card = $(this);
      });
    });
  });
})(jQuery);