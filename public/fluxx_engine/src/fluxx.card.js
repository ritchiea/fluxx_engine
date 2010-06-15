(function($){
  $.fn.extend({
    addFluxxCard: function() {
    }
  });
  
  $.extend(true, {
    fluxx: {
      card: {
        attrs: {
          'class': 'card',
          id: function(){}
        },
        ui: function() {
          return $('<div>')
            .attr($.fluxx.card.attrs)
            .html([
            ].join(''));
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
