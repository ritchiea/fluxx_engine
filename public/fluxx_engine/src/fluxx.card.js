(function($){
  $.fn.extend({
    addFluxxCard: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback($.fluxx.card.defaults,options,onComplete);
      return this.each(function(){
        var $card = $.fluxx.card.ui.call($.my.hand, options)
          .hide()
          .appendTo($.my.hand);
        $card
          .data({
            listing: $('.listing:eq(0)',   $card),
            detail:  $('.detail:eq(0)',    $card),
            box:     $('.card-box:eq(0)',  $card),
            body:    $('.card-body:eq(0)', $card)
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
        $card.fluxxCardListing().bind({
          'listing_update.fluxx.area': _.bind($.fn.fluxxListingUpdate, $card.fluxxCardListing()),
          'get_update.fluxx.area': _.bind($.fn.getFluxxListingUpdate, $card.fluxxCardListing())
        });
        $('.updates', $card).click(
          function(e) { $card.fluxxCardListing().trigger('get_update.fluxx.area'); }
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

            var updates = {};
            _.each(matches, function(match) {
              /* Prefer the last seen update for this object. */
              updates[match.model_id] = match;
            });

            updates = _.values(updates);
            $.fluxx.log("triggering update.fluxx.area: " + updates.length + " ("+$area.attr('class')+" "+ $area.fluxxCard().attr('id')+")")
            if (updates.length) $area.trigger('update.fluxx.area', [updates]);
          });
        });
      });
    },
    fluxxCardUpdatesAvailable: function () {
      return this.data('updates_available');
    },
    updateFluxxCard: function (e, nUpdates) {
      var $card = $(this);
      var updatesAvailable = (this.data('updates_available') || 0) + nUpdates;
      $('.updates .available', $card).text(nUpdates);
      this.data('updates_available', updatesAvailable);
      return this;
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
              _.addUp(
                $areaBody
                  .siblings()
                  .not(':not(:visible)')
                  .filter(function(){ return $(this).css('position') != 'absolute'; }
                ),
                'outerHeight',
                true
              )
            );
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
      return $('.area', this.fluxxCard());
    },
    fluxxCardArea: function() {
      return this.data('area')
        || this.data('area', this.parents('.area:eq(0)').andSelf()).data('area');
    },
    fluxxCardAreaRequest: function () {
      var req = this.fluxxCardArea().data('history')[0];
      return {
        url:  req.url,
        data: req.data,
        type: req.type
      };
    },
    refreshCardArea: function(){
      return this.each(function(){
        var $area = $(this);
        $.fluxx.log(":::refreshCardArea:::", '  '+$area.fluxxCard().attr('id'), '    ' + $area.attr('class'));
        var req = $area.fluxxCardAreaRequest();
        $.extend(req, {area: $area});
        $area.fluxxCardLoadContent(req);
      });
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
    fluxxCardBody: function () {
      return this.fluxxCard().data('body');
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
    areaDetailTransform: function(){
      var $area  = $(this);

      var $forms = $('.body form', $area),
          $flows = $('.footer .workflow', $area);
      $forms.each(function(){
        var $form   = $(this),
            $submit = $(':submit:first', $form);
        /* XXX GENERATE FROM $.fluxx.card.ui.workflowButton() !!! */
        $('<a>').attr('href', $form.attr('action')).text($submit.val()||'Submit').bind('click', function(e){
          $.fluxx.util.itEndsWithMe(e);
          $form.submit();
        }).wrap('<li>').parent().appendTo($flows);
        $submit.hide();
      });
    },
    openListingFilters: function() {
      return this.each(function(){
        var $card    = $(this).fluxxCard(),
            $listing = $card.fluxxCardListing();
        var $filters = $($.fluxx.util.resultOf(
          $.fluxx.card.ui.area,
          {
            type: 'filters'
          }
        ));
        $card.fluxxCardLoadContent({
          area: $filters,
          url: $listing.attr('data-listing-filter'),
          header: '<span>' + 'Filter Listings' + '</span>',
          init: function (e) {
            $filters.appendTo($card.fluxxCardBody());
          }
        });
      });
    },
    closeListingFilters: function() {
      return this.each(function(){
        var $card = $(this).fluxxCard();
        $('.filters', $card).remove();
      });
    },
    openCardModal: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback({url: null, header: 'Modal', target: null},options, onComplete);
      if (!options.url || !options.target) return this;
      return this.each(function(){
        var $card = $(this).fluxxCard();
        var $modal = $($.fluxx.util.resultOf(
            $.fluxx.card.ui.area,
            {
              type: 'modal',
              arrow: 'left',
              closeButton: true,
            }
        )).data('target', options.target);
        $card.fluxxCardLoadContent(
          {
            area: $modal,
            url: options.url,
            header: '<span>' + options.header + '</span>',
            caller: options.target,
            init: function(e) {
              $modal.appendTo($card.fluxxCardBody());
              options.target.disableFluxxArea();
              var $arrow = $('.arrow', $modal);
              var targetPosition = options.target.position().top,
                  targetHeight = options.target.innerHeight(),
                  arrowHeight = $arrow.outerHeight(true);
              $arrow.css({
                top: parseInt(targetPosition - (arrowHeight/2 - targetHeight/2))
              });
              $modal.css({
                left: parseInt(options.target.offsetParent().position().left + options.target.outerWidth(true) + ($arrow.outerWidth(true))),
              });
            }
          },
          function(e) {
            $card.resizeFluxxCard();
          }
        );
      });
    },
    closeCardModal: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback({url: null, header: 'Modal', target: null},options, onComplete);
      return this.each(function(){
        var $modal = $('.modal', $(this).fluxxCard());
        $modal.data('target').enableFluxxArea();
        $modal.remove();
      });
    },
    disableFluxxArea: function () {
      return this.each(function(){
        $(this).fluxxCardArea().addClass('disabled');
      });
    },
    enableFluxxArea: function () {
      return this.each(function(){
        $(this).fluxxCardArea().removeClass('disabled');
      });
    },
    fluxxAreaUpdate: function(e, updates) {
      var $area     = $(e.target),
          seen      = $area.data('updates_seen') || [],
          areaType  = $area.attr('data-type'),
          updates   = _.reject(updates, function(m) {return _.include(seen, m.model_id)}),
          nextEvent = areaType + '_update.fluxx.area';
    
      $area.data('updates_seen', _.flatten([seen, _.pluck(updates, 'model_id')]));
      $area.data('latest_updates', _.pluck(updates, 'model_id'));
      $area.trigger(nextEvent, [updates]);
    },
    fluxxListingUpdate: function(e, updates) {
      var $area   = $(e.target),
          filters = $area.fluxxCardListingFilters(),
          updates = _.select(updates, function(update){
                        return _.isFilterMatch(filters, update);
                    });
      if (!updates.length) return;
      
      var model_ids = _.pluck(updates, 'model_id');
      $.fluxx.log("Triggering update.fluxx.card from fluxxListingUpdate");
      $area.fluxxCard().trigger('update.fluxx.card', [_.size(model_ids)])
    },
    getFluxxListingUpdate: function (e) {
      var $area = $(this);
      var updates = $area.data('latest_updates');
      if (_.isEmpty(updates)) return;
      var req  = $area.fluxxCardAreaRequest();
      $.extend(
        true,
        req,
        {
          data: {
            id: updates
          },
          success: function (data, status, xhr) {
            var $document = $(data);
            var $entries  = $('.entry', $document);
            var $removals = $();
            var IDs = _.intersect(
              _.map($entries, function (e) { return $(e).attr('data-model-id') }),
              _.map($('.entry', $area), function (e) { return $(e).attr('data-model-id') })
            );

            _.each(
              IDs,
              function(id) {$removals = $removals.add($('.entry[data-model-id='+id+']', $area))}
            );
            $removals.remove();
            $entries.addClass('latest').prependTo($('.list', $area));
          }
        }
      );
      $.ajax(req)
    },
    
    /* Data Loaders */
    fluxxCardLoadContent: function (options, onComplete) {
      var defaults = {
        area: undefined,
        type: 'GET',
        url: null,
        data: {},
        caller: $(),
        /* defaults for sections */
        header: '',
        body: '',
        footer: '',
        /* events */
        update: $.noop,
        init: $.noop,
        lifetimeComplete: function(e) {
          var $area = $(this);
          var isSuccess = options.caller.attr('data-is-success'),
              onSuccess = options.caller.attr('data-on-success');

          if (onSuccess&& isSuccess && $(isSuccess, $area).length) {
            _.each(onSuccess.split(/,/), function(action){
              var func = $.fluxx.card.loadingActions[action] || $.noop;
              (_.bind(func, $area))();
            });
          }
        }
      };
      var options = $.fluxx.util.options_with_callback(defaults,options,onComplete);
      options.area
        .unbind('init.fluxx.area')
        .bind('init.fluxx.area', _.callAll(
          $.fluxx.util.itEndsHere,
          options.init
        )).trigger('init.fluxx.area');

      options.area.bind('lifetimeComplete.fluxx.area', _.bind(options.lifetimeComplete, options.area));

      options.area
        .unbind('complete.fluxx.area')
        .bind('complete.fluxx.area', _.callAll(
          $.fluxx.util.itEndsWithMe,
          _.bind($.fn.areaDetailTransform, options.area),
          _.bind($.fn.resizeFluxxCard, options.area.fluxxCard()),
          options.callback
        ));
      options.area
        .unbind('update.fluxx.area')
        .bind('update.fluxx.area', _.callAll(
          $.fluxx.util.itEndsHere,
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
          if (xhr.status == 201) {
            var opts = $.extend(true, options, {type: 'GET', url: xhr.getResponseHeader('Location')});
            $.fluxx.log(opts);
            options.area.fluxxCardLoadContent(opts);
          } else {
            var $document = $('<div/>').html(data);
            $('.header', options.area).html(($('#card-header', $document).html() || options.header).trim());
            $('.body',   options.area).html(($('#card-body',   $document).html() || options.body).trim());
            $('.footer', options.area).html(($('#card-footer', $document).html() || options.footer).trim());
            $('.drawer', options.area).html(($('#card-drawer', $document).html() || '').trim());
            $('.header,.body,.footer,.drawer', options.area).removeClass('empty').filter(':empty').addClass('empty');
            options.area
              .fluxxAreaSettings({settings: $('#card-settings', $document)})
              .trigger('complete.fluxx.area')
              .trigger('lifetimeComplete.fluxx.area');
          }
        },
        error: function(xhr, status, error) {
          var $document = $('<div/>').html(xhr.responseText);
          $('.body', options.area).html($document);
          options.area.trigger('complete.fluxx.area').trigger('lifetimeComplete.fluxx.area');
        },
        beforeSend: function() { $('.loading-indicator', options.area.fluxxCard()).addClass('loading') },
        complete: function() { $('.loading-indicator', options.area.fluxxCard()).removeClass('loading') }
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
                '</div>',
              '</div>'
            ]));
        },
        loadingActions: {
          close: function(){
            this.closeCardModal();
          },
          refreshCaller: function(){
            if (! this.data('target')) return;
            this.data('target').refreshCardArea();
          }
        }
      }
    }
  });
  $.fluxx.card.ui.toolbar = [
    '<div class="toolbar">',
      '<span class="loading-indicator"></span>',
      '<a class="updates" href="#">',
        '<span class="available">0</span>',
        ' update<span class="non-one">s</span>',
        ' available',
      '</a>',
      ' ',
      '<ul class="buttons controls">',
        '<li class="first"><a href="#" class="close-detail">&lArr;</a></li>',
        '<li><a href="#" class="minimize-card">&#9604;</a></li>',
        '<li class="last"><a href="#" class="close-card">&times;</a></li>',
      '</ul>',
    '</div>'
  ].join('');
  $.fluxx.card.ui.titlebar = function(options) {
    return [
      '<div class="titlebar">',
        '<span class="title">',
          options.title,
        '</span>',
        '<ul class="content-actions">',
          '<li><a href="#" class="refresh-card"><img src="',$.fluxx.util.iconImage('arrow_refresh'),'" /></a></li>',
          '<li><a href="#" class="open-filters"><img src="',$.fluxx.util.iconImage('cog_edit'),'" /></a></li>',
        '</ul>',
      '</div>'
    ];
  };
  $.fluxx.card.ui.contentAction = function(options) {
    return [
      /* Make a list entry with a link and an image tag */
    ];
  };
  $.fluxx.card.ui.area = function(options) {
    var types = _.flatten($.merge($.makeArray(options.type), ['area']));
    return [
      '<div class="', types.join(' '), '" data-type="', options.type ,'">',
        (options.closeButton ? ['<ul class="controls"><li><a href="#" class="close-modal">&times;</a></li></ul>'] : null),
        (options.arrow ? ['<div class="arrow ', options.arrow, '"></div>'] : null),
        '<div class="header"></div>',
        '<div class="body"></div>',
        '<div class="footer"></div>',
        (options.drawer ? '<div class="drawer"></div>' : null),
      '</div>'
    ];
  };
  
  $(window).resize(function(e){
    $.my.cards.resizeFluxxCard();
  }).resize();
})(jQuery);
