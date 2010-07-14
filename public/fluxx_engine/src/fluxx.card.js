(function($){
  $.fn.extend({
    addFluxxCard: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback($.fluxx.card.defaults,options,onComplete);
      return this.each(function(){
        var $card = $.fluxx.card.ui.call($.my.hand, options).hide()
          .appendTo($.my.hand);
        $card
          .data({
            listing: $('.listing:eq(0)',  $card),
            detail:  $('.detail:eq(0)',   $card),
            box:     $('.card-box:eq(0)', $card)
          })
          .bind({
            'complete.fluxx.card': _.callAll(
              $.fluxx.util.itEndsHere,
              function(){$card.show();},
              _.bind($.fn.resizeFluxxCard, $card),
              _.bind($.fn.resizeFluxxStage, $.my.stage),
              _.bind($.fn.subscribeFluxxCardToUpdates, $card),
              options.callback
            ),
            'load.fluxx.card': options.load,
            'close.fluxx.card': options.close,
            'unload.fluxx.card': options.unload,
            'update.fluxx.card': _.callAll(
              _.bind($.fn.updateFluxxCard, $card),
              options.update
            )
          });
        $card.trigger('load.fluxx.card');
        $card.fluxxCardListing().bind(
          'listing_update.fluxx.area',
          _.bind($.fn.fluxxListingUpdate, $card.fluxxCardListing())
        );
        $card.fluxxCardLoadListing({url: options.listing.url}, function(){
          $card.fluxxCardLoadDetail({url: options.detail.url}, function(){
            $card.trigger('complete.fluxx.card');
          })
        });
        $.my.cards = $('.card');
      });
    },
    subscribeFluxxCardToUpdates: function () {
      return this.each(function(){
        if (!$.fluxx.realtime_updates) return;

        var $card = $(this);
        $.fluxx.realtime_updates.subscribe(function(e, data, status) {
          var poller = e.target;
          $card.fluxxCardAreas().each(function(){
            var $area = $(this),
                model = $area.attr('data-model-class');
            var matches = _.compact(_.map(data.deltas, function(delta) {
              return model == delta.model_class ? delta : false
            }));
            $.fluxx.log("triggering update: " + matches.length)
            if (matches.length) $area.trigger('update.fluxx.area', [matches]);
          });
        });
      });
    },
    updateFluxxCard: function (e, nUpdates) {
      var $card = $(this);
      $('.titlebar', $card).text(nUpdates);
    },
    removeFluxxCard: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback({},options,onComplete);
      return this.each(function(){
        $(this)
          .bind({
            'unload.fluxx.card': _.callAll(
              options.callback,
              function(e){ $(e.target).remove(); $.my.cards = $('.card') }
            )
          })
          .trigger('close.fluxx.card')
          .trigger('unload.fluxx.card');
      });
    },
    resizeFluxxCard: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback({},options,onComplete);
      if (!$.my.hand) return this;

      $('.card-box', this)
        .height(
          $.my.cards.height(
            $.my.hand.innerHeight() -
            $.fluxx.util.marginHeight($.my.cards)
          ).innerHeight()
        )
        .each(function(){
          var $box      = $(this),
              $cardBody = $('.card-body', $box);
          $('.area', $cardBody).height(
            $cardBody.height(
              $cardBody.parent().innerHeight() -
              _.addUp($cardBody.siblings(), 'outerHeight', true)
            ).innerHeight()
          ).each(function(){
            var $area     = $(this),
                $areaBody = $('.body', $area);
            $areaBody.height(
              $areaBody.parent().innerHeight() -
              _.addUp($areaBody.siblings().not('.drawer'), 'outerHeight', true)
            )
          });
        });

      return this;
    },
    
    /* Accessors */
    fluxxCard: function() {
      return this.data('card')
        || this.data('card', this.parents('.card:eq(0)').andSelf()).data('card');
    },
    fluxxCardAreas: function () {
      var $card = this.fluxxCard();
      return $card.data('areas')
        || $card.data('areas', $card.find('.area'));
    },
    fluxxCardArea: function() {
      return this.data('area')
        || this.data('area', this.parents('.area:eq(0)').andSelf()).data('area');
    },
    fluxxCardAreaURL: function() {
      return this.fluxxCardArea().data('history')[0].url;
    },
    fluxxCardListingFilters: function() {
      return this.fluxxCardArea().data('history')[0].data;
    },
    fluxxCardListing: function() {
      return this.fluxxCard().data('listing');
    },
    fluxxCardDetail: function () {
      return this.fluxxCard().data('detail');
    },
    fluxxCardBox: function () {
      return this.fluxxCard().data('box');
    },
    fluxxAreaSettings: function (options) {
      var options = $.fluxx.util.options_with_callback({settings: $()},options);
      if (options.settings.length < 1) return this;
      return this.each(function(){
        var $area = $(this);
        _.each(options.settings.children(), function (setting) {
          var key = $(setting).attr('name'),
              val = $(setting).text();
          $area.attr('data-' + key, val);
        })
      })
    },
    fluxxAreaUpdate: function(e, matches) {
      var $area     = $(e.target),
          seen      = $area.data('updates_seen') || [],
          areaType  = $area.attr('data-type'),
          matches   = _.reject(matches, function(m) {return _.include(seen, m.model_id)}),
          updates   = {},
          nextEvent = areaType + '_update.fluxx.area';
    
      var updates = {};
      _.each(matches, function(match) {
        /* Prefer the last seen update for this object. */
        updates[match.model_id] = match;
      });      
      $area.data('updates_seen', _.flatten([seen, _.pluck(matches, 'model_id')]));
      $area.trigger(nextEvent, [_.values(updates)]);
    },
    fluxxListingUpdate: function(e, updates) {
      var $area   = $(e.target),
          filters = $area.fluxxCardListingFilters(),
          updates = _.select(updates, function(update){
                        return _.isFilterMatch(filters, update);
                    });
      if (!updates.length) return;
      
      var model_ids = _.pluck(updates, 'model_id');
      $area.fluxxCard().trigger('update.fluxx.card', [_.size(model_ids)])
    },
    
    /* Data Loaders */
    fluxxCardLoadContent: function (options, onComplete) {
      var defaults = {
        area: undefined,
        type: 'GET',
        url: null,
        data: {},
        update: $.noop
      };
      var options = $.fluxx.util.options_with_callback(defaults,options,onComplete);
      options.area
        .unbind('complete.fluxx.area')
        .bind('complete.fluxx.area', _.callAll(
          $.fluxx.util.itEndsWithMe,
          options.callback
        ));
      options.area
        .unbind('update.fluxx.area')
        .bind('update.fluxx.area', _.callAll(
          _.bind($.fn.fluxxAreaUpdate, options.area),
          options.update
        ));

      if (!options.url) {
        options.area.trigger('complete.fluxx.area');
        return this;
      }
      if (!options.area.data('history')) {
        options.area.data('history', [options]);
      } else {
        options.area.data('history').unshift(options);
      }

      $.ajax({
        url: options.url,
        type: options.type,
        data: options.data,
        success: function (data, status, xhr) {
          var $document = $('<div/>').html(data);
          $('.header', options.area).html($('#card-header', $document).html() || '&nbsp;');
          $('.body',   options.area).html($('#card-body',   $document).html() || '&nbsp;');
          $('.footer', options.area).html($('#card-footer', $document).html() || '&nbsp;');
          $('.drawer', options.area).html($('#card-drawer', $document).html() || '&nbsp;');
          options.area.fluxxAreaSettings({settings: $('#card-settings', $document)}).trigger('complete.fluxx.area');
        },
        error: function(xhr, status, error) {
          options.area.trigger('complete.fluxx.area');
        }
      });
      
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
          load: $.noop,
          close: $.noop,
          unload: $.noop,
          update: $.noop,
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
                  $.fluxx.util.resultOf($.fluxx.card.ui.area, $.extend(options,{type: 'detail', drawer: true})),
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
    var types = ['area'];
    types.unshift(options.type);
    return [
      '<div class="', types.join(' '), '" data-type="', options.type ,'">',
        '<div class="header"></div>',
        '<div class="body"></div>',
        '<div class="footer"></div>',
        (options.drawer ? '<div class="drawer"></div>' : ''),
      '</div>'
    ];
  };

  $(window).resize(function(e){
    $.my.cards.resizeFluxxCard();
  });
})(jQuery);
