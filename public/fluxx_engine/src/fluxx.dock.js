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

        $('.icon', '.dock').live('mouseover mouseout', function(e) {
          var $icon  = $(e.currentTarget);
          var $popup = $('.popup', $icon);
          if (e.type == 'mouseover') {
            $popup.show();
          } else {
            $popup.hide();
          }
        });
      });
    },
    
    addViewPortIcon: function(options) {
      var options = $.fluxx.util.options_with_callback({}, options);
      return this.each(function(){
        if (options.card.data('icon')) return;
        var $icon = $.fluxx.dock.ui.icon.call($.my.dock, {
          label: options.card.fluxxCardTitle(),
          url: '#'+options.card.attr('id'),
          popup: options.card.fluxxCardTitle(),
          type: options.card.fluxxCardIconStyle()
        }).updateIconBadge();
        if (options.card.prev().length) {
            $icon.insertAfter($('a[href=#'+options.card.prev().attr('id')+']', $.my.iconlist).parents('.icon').first());
        } else {
          $icon.prependTo($.my.iconlist);
        }
        options.card.data('icon', $icon);
        $icon.data('card', options.card);
        if (options.card.fluxxCardIconStyle() == "")
          $icon.hide();
      });
    },
    updateIconBadge: function (options) {
      var options = $.fluxx.util.options_with_callback({badge: ''}, options);
      return this.each(function(){
        var $icon  = $(this),
            $badge = $('.badge', $icon);
        $badge.text(options.badge);
        $badge.is(':empty') || $badge.text() == 0 ? $badge.hide() : $badge.show();
      });
    },
    setViewPortIconStyle: function (options) {
      var options = $.fluxx.util.options_with_callback({badge: ''}, options);
      return this.each(function(){
        var $icon  = $(this);
        $icon.addClass(options.style);
        $icon.show();
      });
    }, 
    updateIconLabel: function(options) {
      var options = $.fluxx.util.options_with_callback({label: ''}, options);
      return this.each(function(){
        var $icon  = $(this),
            $label = $('.label', $icon),
            $popup = $('.popup > ul > li', $icon);
        $label.text(options.label);
        $popup.text(options.label);
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
              $.fluxx.dock.ui.viewport(options),
              $.fluxx.dock.ui.quicklinks(options)
            ]));
        }
      }
    }
  });
  $.fluxx.dock.ui.quicklinks = function (options) {
    return $.fluxx.util.resultOf([
      '<div id="quicklinks">',
          _.map($.fluxx.config.dock.quicklinks, function(qlset) {
            return [
              '<ol class="qllist">',
                _.map(qlset, function(ql) {
                  return $.fluxx.dock.ui.icon.call($.my.dock, ql);
                }),
              '</ol>'
            ];
          }),
      '</div>'
    ]);
  };
  $.fluxx.dock.ui.viewport = function (options) {
    return $.fluxx.util.resultOf([
      '<div id="viewport">',
        '<ol id="iconlist"></ol>',
      '</div>'
    ]);
  };
  $.fluxx.dock.ui.icon = function(options) {
    $.fluxx.log("--- pre-default icon options ---",options)
    var options = $.fluxx.util.options_with_callback({
      label: '',
      badge: '',
      url:   '',
      popup: null,
      openOn: ['hover'],
      className: 'scroll-to-card',
      type: null
    }, options);
    $.fluxx.log("--- icon options ---",options)
    var popup = (
        !_.isNull(options.popup)
      ? [
          '<div class="popup"><ul>',
            _.map(
              _.flatten($.makeArray(options.popup)),
              function (line) {return ['<li>', line, '</li>'];}
            ),
          '</ul><div class="arrow"></div></div>'
        ]
      : ''
    );
    
    return $($.fluxx.util.resultOf([
      '<li class="icon ', options.type, '">',
        '<a class="link ', options.className, '" href="', options.url, '" title="', options.label, '">',
          '<span class="label">', options.label, '</span>',
          '<span class="badge">', options.badge, '</span>',
        '</a>',
        popup,
      '</li>'
    ]));
  };
  
  $(function($){
    $('#stage').live('complete.fluxx.stage', function(e) {
      $.my.footer.addFluxxDock(function(){
        $('.card')
          .live('lifetimeComplete.fluxx.area', function(e){
            $.fluxx.log("dock is bound to lifetimeComplete.fluxx.card");
            $.fluxx.util.itEndsWithMe(e);
          })
         .live('close.fluxx.card', function(e){
            $.fluxx.util.itEndsWithMe(e);
            $.my.dock.removeViewPortIcon({card: $(this)});
          })
          .live('update.fluxx.card', function (e, nUpdate) {
            if (!_.isEmpty(nUpdate) || !$(e.target).data('icon')) return;
            var $card = $(e.target);
            $card.data('icon')
              .updateIconBadge({badge: $card.fluxxCardUpdatesAvailable()})
              .updateIconLabel($card.fluxxCardTitle());
          });
      });
    });
  });
})(jQuery);