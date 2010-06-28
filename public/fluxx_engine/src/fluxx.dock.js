(function($){
  $.fn.extend({
    addFluxxDock: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback($.fluxx.dock.defaults,options,onComplete);
      return this.each(function(){
        $.my.dock = $.fluxx.dock.ui.call($.my.footer, options)
          .appendTo($.my.footer);
        $.my.dock
          .bind({
            'complete.fluxx.dock': _.callAll(options.callback, $.fluxx.util.itEndsWithMe)
          })
          .trigger('complete.fluxx.dock');
      });
    },
    
    addViewPortIcon: function(options) {
      var options = $.fluxx.util.options_with_callback({}, options);
      return this.each(function(){
        if (options.card.data('icon')) return;
        var $icon = $('<div>')
          .text(options.card.attr('id'))
          .appendTo($.my.dock)
          .data('card', options.card)
          .css({display: 'inline-block'});
        options.card.data('icon', $icon);
        $.fluxx.log(options.card.attr('id'));
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
            .attr($.fluxx.dock.attrs)
            .html($.fluxx.util.resultOf([
              'Hello'
            ]));
        }
      }
    }
  });
  
  $(function($){
    $('#stage').live('complete.fluxx.stage', function(e) {
      $.my.footer.addFluxxDock(function(){
        $('.card')
          .each(function(){ $.my.dock.addViewPortIcon({card: $(this)}); })
          .live('load.fluxx.card', function(e){
            $.fluxx.util.itEndsWithMe(e);
            $.my.dock.addViewPortIcon({card: $(this)});
          });
      });
    });
  });
})(jQuery);