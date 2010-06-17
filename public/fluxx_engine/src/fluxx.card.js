(function($){
  $.fn.extend({
    addFluxxCard: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback($.fluxx.card.defaults,options,onComplete);
      return this.each(function(){
        var $card = $.fluxx.card.ui.call($.my.hand);
        $card.appendTo($.my.hand);
      });
    }
  });
  
  $.extend(true, {
    fluxx: {
      card: {
        defaults: {
          
        },
        attrs: {
          'class': 'card',
          id: function(){return $.fluxx.card.nextId();}
        },
        ui: function() {
          return $('<li>')
            .attr($.fluxx.card.attrs)
            .html([
              'hi'
            ].join(''));
        },
        nextIdNumber: 0,
        nextId: function() {
          return 'fluxx-card-' + $.fluxx.card.nextIdNumber++;
        }
      }
    }
  });
  $.fluxx.card.ui.toolbar = [
    '<div id="header">',
      '<div id="logo"><a href=".">FLUXX</a></div>',
      '<ul class="actions">',
      '</ul>',
    '</div>'
  ].join('');

})(jQuery);
