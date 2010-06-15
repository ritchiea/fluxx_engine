(function($){
  $.fn.extend({
    fluxxStage: function() {
      $my['fluxx']  = $(this);
      $my['stage'] = $.fluxx.stage.ui.call(this).trigger('load');
      $my.fluxx.html($my.stage);
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
