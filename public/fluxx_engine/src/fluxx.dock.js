(function($){
  $.fn.extend({
    addFluxxDock: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback($.fluxx.dock.defaults,options,onComplete);
      return this.each(function(){
        $.my.dock = $.fluxx.dock.ui.call($.my.footer, options)
          .appendTo($.my.footer);
        $.my.viewport = $('#viewport');
        $.my.iconlist = $('#iconlist');
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
        var $icon = $.fluxx.dock.ui.viewportIcon.call(this, options).appendTo($.my.iconlist);
        options.card.data('icon', $icon);
        $icon.data('card', options.card);
      });
    },
    
    removeViewPortIcon: function(options) {
      var options = $.fluxx.util.options_with_callback({}, options);
      return this.each(function(){
        if (!options.card.data('icon')) return;
        options.card.data('icon').remove();
        options.card.data('icon', null);
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
              $.fluxx.dock.ui.viewport(options)
            ]));
        }
      }
    }
  });
  $.fluxx.dock.ui.viewport = function (options) {
    return $.fluxx.util.resultOf([
      '<div id="viewport">',
        '<ol id="iconlist"></ol>',
      '</div>'
    ]);
  };
  $.fluxx.dock.ui.viewportIcon = function (options) {
    return $($.fluxx.util.resultOf([
      '<li class="icon">',
        '<a class="link" href="#', options.card.attr('id'), '">',
          '<span class="label">Card</span>',
        '</a>',
      '</li>'
    ]));
  };
  
  $(function($){
    $('#stage').live('complete.fluxx.stage', function(e) {
      $.my.footer.addFluxxDock(function(){
        $('.card')
          .each(function(){ $.my.dock.addViewPortIcon({card: $(this)}); })
          .live('load.fluxx.card', function(e){
            $.fluxx.util.itEndsWithMe(e);
            $.my.dock.addViewPortIcon({card: $(this)});
          })
         .live('close.fluxx.card', function(e){
            $.fluxx.util.itEndsWithMe(e);
            $.my.dock.removeViewPortIcon({card: $(this)});
          })
          .live('update.fluxx.card', function (e, nUpdate) {
            $(e.target).data('icon').text(nUpdate);
          });
      });
    });
  });
})(jQuery);