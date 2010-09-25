(function($){
  $.fn.extend({
    addFluxxDock: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback($.fluxx.dock.defaults,options,onComplete);
      return this.each(function(){
        $.my.dock = $.fluxx.dock.ui.call($.my.footer, options)
          .appendTo($.my.footer);
        $.my.viewport = $('#viewport');
        $.my.iconlist = $('#iconlist');
        $.my.lookingGlass = $('#lookingglass');
        $.my.dock
          .bind({
            'complete.fluxx.dock': _.callAll(options.callback, $.fluxx.util.itEndsWithMe)
          })
          .trigger('complete.fluxx.dock');
        $.my.stage.bind('resize.fluxx.stage', $.my.dock.fluxxDockUpdateViewing);
        $(window).scroll($.my.dock.fluxxDockUpdateViewing);

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
        if (options.hasOwnProperty("scrollTo") && options.scrollTo)
          $('a', $icon).click();
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
    },
    fluxxDockUpdateViewing: function(e){
      var $cards = $.my.cards;
      var $glass = $.my.lookingGlass;
      
      if ($cards.length == 0) {
        $glass.hide();
        return;
      }
      
      var $viewport = $.my.viewport;
      var left = 0;
      var right = 0;
      var scroll = $(window).scrollLeft();
      var leftFound = false;
      var lastIcon = $('a', $.my.iconlist).last().attr('href');
      
      $cards.each(function(){
        var $card = $(this);
        var cardWidth = $card.width();
        var position = $card.offset().left + cardWidth;
        var $icon = $('a[href=#'+$card.attr('id')+']', $.my.iconlist);
        if (!leftFound && scroll < position) {
          // Calculate left edge of window
          var percentIn = (scroll - $card.offset().left) / cardWidth; 
          left = Math.round(($icon.offset().left - scroll - ($icon.width() / 3)) + ($icon.width() * percentIn));
          leftFound = true;
        }
        
        var lastCard = ($icon.attr('href') == lastIcon);
        var rightEdge = scroll + $(window).width();
        if (lastCard || position > rightEdge) {
          // Calculate right edge of window
          var percentIn = (lastCard && position < rightEdge ? 1 : (rightEdge - $card.offset().left) / cardWidth);
          right = Math.round(($icon.offset().left - scroll - ($icon.width() / 3)) + ($icon.width() * percentIn));
          return false;
        }
      });
      $glass.css({left: left, top: $viewport.offset().top});
      $glass.show();
      $glass.width(Math.round(right - left));
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
              $.fluxx.dock.ui.quicklinks(options),
              $.fluxx.dock.ui.lookingGlass(options)
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
  $.fluxx.dock.ui.lookingGlass = function (option) {
    return '<div id="lookingglass"></div>';
  };
  $.fluxx.dock.ui.icon = function(options) {
    $.fluxx.log("--- pre-default icon options ---",options);
    var options = $.fluxx.util.options_with_callback({
      label: '',
      badge: '',
      url:   '',
      popup: null,
      openOn: ['hover'],
      className: 'scroll-to-card',
      type: null
    }, options);
    $.fluxx.log("--- icon options ---",options);
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