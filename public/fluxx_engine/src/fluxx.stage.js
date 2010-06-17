(function($){
  $.fn.extend({
    fluxxStage: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback({}, options, onComplete);
      return this.each(function(){
        $.my.fluxx  = $(this);
        $.my.stage  = $.fluxx.stage.ui.call(this, options).appendTo($.my.fluxx.empty());
        $.my.hand   = $('#hand');
        $.my.stage
          .bind('complete', options.callback)
          .bind('complete', function(){ $.my.hand.addFluxxCards({cards: $.fluxx.config.cards}) })
          .trigger('complete');
      });
    },
    removeFluxxStage: function(onComplete) {
      var options = $.fluxx.util.options_with_callback({}, onComplete);
      return this.each(function(){
        $(this).remove();
        $.my.stage.trigger('unload');
        $.my.stage = undefined;
        $.my.hand  = undefined;
        options.callback.call(this);
      });
    },
    
    addFluxxCards: function(options) {
      var options = $.fluxx.util.options_with_callback({}, options);
      return this.each(function(){
        $.each(options.cards, function() { $.my.hand.addFluxxCard(this) });
      });
    }
  });
  
  $.extend(true, {
    fluxx: {
      stage: {
        attrs: {
          id: 'stage'
        },
        ui: function(optoins) {
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
