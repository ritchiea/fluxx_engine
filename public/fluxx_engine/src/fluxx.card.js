(function($){
  $.fn.extend({
    addFluxxCard: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback($.fluxx.card.defaults,options,onComplete);
      return this.each(function(){
        var $card = $.fluxx.card.ui.call($.my.hand, options);
        $card
          .appendTo($.my.hand)
          .bind('fluxx.card.complete', options.callback)
          .bind('fluxx.card.load', options.onload)
          .data({
            listing: $('.listing:eq(0)', $card),
            detail: $('.detail:eq(0)', $card)
          });
        $card.triggerHandler('fluxx.card.load')
        $card.fluxxCardLoadListing({url: options.listing.url}, function(){
          $card.fluxxCardLoadDetail({url: options.detail.url}, function(){
            $card.triggerHandler('fluxx.card.complete');
          })
        });
      });
    },
    
    fluxxCard: function() {
      return this.data('card')
       || this.data('card', this.parents('.card:eq(0)').andSelf()).data('card');
    },
    fluxxCardListing: function() {
      return this.fluxxCard().data('listing');
    },
    fluxxCardDetail: function () {
      return this.fluxxCard().data('detail');
    },
    
    fluxxCardLoadContent: function (options, onComplete) {
      var defaults = {
        area: undefined,
        type: 'GET',
        url: null,
        data: {}
      };
      var options = $.fluxx.util.options_with_callback(defaults,options,onComplete);
      if (!options.url) return this;
      options.area.one('fluxx.area.complete', options.callback);
      
      $.ajax({
        url: options.url,
        type: options.type,
        data: options.data,
        success: function (data, status, xhr) {
          var $document = $('<div/>').html(data);
          $('.header', options.area).html($('#card-header', $document).html());
          $('.body',   options.area).html($('#card-body',   $document).html());
          $('.footer', options.area).html($('#card-footer', $document).html());
        }
      });
      
      options.area.triggerHandler('fluxx.area.complete');
      return this;
    },
    
    fluxxCardLoadListing: function (options, onComplete) {
      var options = $.fluxx.util.options_with_callback({area: this.fluxxCardListing()},options,onComplete);
      return this.fluxxCardLoadContent(options);
    },
    
    fluxxCardLoadDetail: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback({area: this.fluxxCardDetail()},options,onComplete);
      return this.fluxxCardLoadContent(options);
    }
  });
  
  $.extend(true, {
    fluxx: {
      card: {
        defaults: {
          title: 'New Card',
          onload: $.noop,
          listing: {
            url: null
          },
          detail: {
            url: null
          }
        },
        attrs: {
          'class': 'card',
          id: function(){return _.uniqueId('fluxx-card-')}
        },
        ui: function(options) {
          return $('<li>')
            .attr($.fluxx.card.attrs)
            .html($.fluxx.util.resultOf([
              '<div class="card-box">',
                '<div class="card-header">',
                  $.fluxx.util.resultOf($.fluxx.card.ui.toolbar,  options),
                  $.fluxx.util.resultOf($.fluxx.card.ui.titlebar, options),
                '</div>',
                '<div class="card-body">',
                  $.fluxx.util.resultOf($.fluxx.card.ui.area, $.extend(options,{type: 'listing'})),
                  $.fluxx.util.resultOf($.fluxx.card.ui.area, $.extend(options,{type: 'detail'})),
                '</div>',
                '<div class="card-footer">',
                  'Card Footer',
                '</div>',
              '</div>'
            ]));
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
    return [
      '<div class="titlebar">',
        options.title,
      '</div>'
    ];
  };
  $.fluxx.card.ui.area = function(options) {
    return [
      '<div class="', options.type, '">',
        '<div class="header"></div>',
        '<div class="body"></div>',
        '<div class="footer"></div>',
      '</div>'
    ];
  };

})(jQuery);
