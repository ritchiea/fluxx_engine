(function($){
  $.fn.extend({
    addFluxxCard: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback($.fluxx.card.defaults,options,onComplete);
      return this.each(function(){
        var $card = $.fluxx.card.ui.call($.my.hand, options);
        $card.appendTo($.my.hand);
      });
    }
  });
  
  $.extend(true, {
    fluxx: {
      card: {
        defaults: {
          title: 'New Card'
        },
        attrs: {
          'class': 'card',
          id: function(){return $.fluxx.card.nextId();}
        },
        ui: function(options) {
          return $('<li>')
            .attr($.fluxx.card.attrs)
            .html([
              '<div class="card-box">',
                '<div class="card-header">',
                  $.fluxx.util.resultOf($.fluxx.card.ui.toolbar,  options),
                  $.fluxx.util.resultOf($.fluxx.card.ui.titlebar, options),
                '</div>',
                '<div class="card-body">',
                '</div>',
                '<div class="card-footer">',
                '</div>',
              '</div>'
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
    '<div class="toolbar">',
      'min, close, etc',
    '</div>'
  ].join('');
  $.fluxx.card.ui.titlebar = function(options) {
    console.log(arguments);
    return [
      '<div class="titlebar">',
        options.title,
      '</div>'
    ];
  };

})(jQuery);
