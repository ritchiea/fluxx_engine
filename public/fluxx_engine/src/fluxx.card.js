(function($){
  $.fn.extend({
    addFluxxCard: function(options, onComplete) {
      $.fluxx.log("**> addFluxxCard");
      var options = $.fluxx.util.options_with_callback($.fluxx.card.defaults,options,onComplete);
      return this.each(function(){
        var $card = $.fluxx.card.ui.call($.my.hand, options).hide();
        options.position($card);
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
              function(){$card.fadeIn('slow');},
              _.bind($.fn.resizeFluxxCard, $card),
              _.bind($.fn.editableCardTitle, $card),
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
        $('.updates', $card).hide();
        $card.trigger('load.fluxx.card');
        $card.fluxxCardListing().bind({
          'listing_update.fluxx.area': _.bind($.fn.fluxxListingUpdate, $card.fluxxCardListing()),
          'get_update.fluxx.area': _.bind($.fn.getFluxxListingUpdate, $card.fluxxCardListing())
        });
        $('.updates', $card).click(
          function(e) { $card.fluxxCardListing().trigger('get_update.fluxx.area'); }
        );
        $card.fluxxCardLoadListing(options.listing, function(){
          $card.fluxxCardLoadDetail(options.detail, function(){
            $card.trigger('complete.fluxx.card');
            $('.titlebar .icon', $card).addClass($card.fluxxCardIconStyle());
            $card.trigger('lifetimeComplete.fluxx.card');
            if (!options.hasOwnProperty("fromClientStore")) $.fn.positionDashboard.call();
          })
        });
        $.my.cards = $('.card').resizeFluxxCard();
      });
    },
    editableCardTitle: function() {
      var $card = $(this);
      var $title = $('.title', $card);
      var getReturn = function(e){
        if (e.which == 13) {
          $.fluxx.util.itEndsWithMe(e);
          $title.attr('contenteditable', 'false').unbind('keypress', getReturn);
          $title.text($card.fluxxCardTitle());
          $card.data('icon').updateIconLabel({label: $title.text()});
          $card.saveDashboard();
          return false;
        }
      };
      $title.click(function(e){
        $title.attr('contenteditable', 'true').keypress(getReturn);
      });
    },
    serializeFluxxCard: function(){
      var $card = $(this).first();
      return {
        title:   $card.fluxxCardTitle(),
        listing: $card.fluxxCardListing().fluxxCardAreaRequest() || {},
        detail:  $card.fluxxCardDetail().fluxxCardAreaRequest() || {}
      };
    },
    subscribeFluxxCardToUpdates: function () {
      $.fluxx.log("**> subscribeFluxxCardToUpdates");
      return this.each(function(){
        if (!$.fluxx.realtime_updates) return;

        var $card = $(this);
        $.fluxx.realtime_updates.subscribe(function(e, data, status) {
          $.fluxx.log("Found " + data.deltas.length + " deltas.");
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
            $.fluxx.log("triggering update.fluxx.area["+$card.attr('id') + ' :: ' + model+"]: " + updates.length + " ("+$area.attr('class')+" "+ $area.fluxxCard().attr('id')+")")
            if (updates.length) $area.trigger('update.fluxx.area', [updates]);
          });
        });
      });
    },
    positionDashboard: function () {
      if (!$.fluxx.dashboard.firstLoad) {
        $(window).scrollLeft($(window).width() + 10000); 
      }
    },
    fluxxCardUpdatesAvailable: function () {
      $.fluxx.log("**> fluxxCardUpdatesAvailable");
      return this.data('updates_available') || 0;
    },
    updateFluxxCard: function (e, nUpdates, calling) {
      $.fluxx.log("**> updateFluxxCard");
      var $card = $(this);
      var updatesAvailable = $card.fluxxCardUpdatesAvailable() + nUpdates; 
      if (updatesAvailable < 0) updatesAvailable = 0;
      this.data('updates_available', updatesAvailable);
      $.fluxx.log("update.fluxx.card triggered from [" + calling + ']', "TOTAL UPDATES AVAILABLE: " + $card.fluxxCardUpdatesAvailable() + '; ' + nUpdates + ' NEW');
      $('.updates .available', $card).text($card.fluxxCardUpdatesAvailable());
      if (updatesAvailable <= 0) {
        $('.updates', $card).hide();
        $card.removeClass('updates-available');
      } else {
        $('.updates', $card).show();
        $card.addClass('updates-available');
      }
      return this;
    },
    removeFluxxCard: function(options, onComplete) {
      $.fluxx.log("**> removeFluxxCard");
      var options = $.fluxx.util.options_with_callback({},options,onComplete);
      this.each(function(){
        $(this)
          .fluxxCard()
          .bind({
            'unload.fluxx.card': _.callAll(
              options.callback,
              function(e){ $(e.target).fadeOut(
                'slow',
                function(){
                  $(this).remove();
                  $.my.cards = $('.card');
                  $.my.stage.resizeFluxxStage();
                });
              }
            )
          })
          .trigger('close.fluxx.card')
          .trigger('unload.fluxx.card');
      });
      return this;
    },
    resizeFluxxCard: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback({},options,onComplete);
      
      if (!$.my.hand) return this;
      return this.each(function() {
        var $card = $(this).fluxxCard();
        $('.card-box', $card)
          .height(
            $.my.cards.height(
              $.my.hand.innerHeight() -
              $.fluxx.util.marginHeight($.my.cards)
            ).innerHeight()
          )
          .each(function(){
            var $box      = $(this),
                $cardBody = $('.card-body', $box);
            $box.width(
              _.addUp(
                $('.area', $box).not(':not(:visible)').filter(function(){ return $(this).css('position') != 'absolute'; }),
                'outerWidth', true
              ) + 2
            );
          
            $('.area', $cardBody).height(
              $cardBody.height(
                $cardBody.parent().innerHeight() -
                _.addUp(
                  $cardBody
                    .siblings()
                    .not(':not(:visible)')
                    .filter(function(){ return $(this).css('position') != 'absolute'; }),
                  'outerHeight', true
                )
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
                    .filter(function(){ return $(this).css('position') != 'absolute'; }),
                  'outerHeight',
                  true
                )
              );
            })
          });
        
        var $tabs = $('.tabs', $card);
        $tabs.width($('.drawer', $card).height());
        var tabsWidth = $tabs.width(), innerWidth = _.addUp($('.label', $tabs), 'outerWidth', true);
        if ($tabs.width() < _.addUp($('.label', $tabs), 'outerWidth', true)) {
          $('.info .scroller').show();
        } else {
          $('.info .scroller').hide();
        }
        var cardWidth = _.addUp(
            $card
              .children()
              .filter(':visible')
              .filter(function(){ return $(this).css('position') != 'absolute'; }),
            'outerWidth', false
          )
          +
          $('.drawer', $card).parent().filter(':visible').outerWidth(true);
        if (cardWidth == 0) {
          var refresh = function () {
            $(window).resize();
          };
          setTimeout(refresh, 5000);
        } else {
          $card.width(cardWidth);
        }
        
        _.bind($.fn.resizeFluxxStage, $.my.stage)();
      });
    },

    /* Accessors */
    fluxxCard: function() {
      return this.data('card')
        || this.data('card', this.parents('.card:eq(0)').andSelf().first()).data('card');
    },
    fluxxCardAreas: function () {
      return $('.area', this.fluxxCard());
    },
    fluxxCardArea: function() {
      return this.data('area')
        || this.data('area', this.parents('.area:eq(0)').andSelf().first()).data('area');
    },
    fluxxCardPartial: function() {
      return this.data('partial')
        || this.data('partial', this.parents('.partial:eq(0)').andSelf().first()).data('partial');
    },
    fluxxCardAreaRequest: function () {
      var history = this.fluxxCardArea().data('history');
      if (_.isEmpty(history)) return null;
      var req = history[0];
      return {
        url:  req.url,
        data: req.data
      };
    },
    refreshAreaPartial: function(options){
      $.fluxx.log("**> refreshAreaPartial");
      var options = $.fluxx.util.options_with_callback({animate: true},options);
      return this.each(function(){
        var $partial = $(this).fluxxCardPartial();
        if (1||options.animate) {
          $.ajax({
            url: $partial.attr('data-src'),
            beforeSend: function() {
              $partial
                .addClass('updating')
                .children()
                .fadeOut(function(){$(this).remove()});
            },
            success: function(data, status, xhr){
              $partial.html($(data).hide()).removeClass('updating').children().fadeIn();
            }
          });
        } else {
          $.ajax({
            url: $partial.attr('data-src'),
            success: function(data, status, xhr){
              $partial.html(data);
            }
          });
        }
      });
    },
    refreshCardArea: function(){
      $.fluxx.log("**> refreshCardArea");
      return this.each(function(){
        var $area = $(this).fluxxCardArea();
        $.fluxx.log(":::refreshCardArea:::", '  '+$area.fluxxCard().attr('id'), '    ' + $area.attr('class'));
        var req = $area.fluxxCardAreaRequest();
        $.extend(req, {area: $area});
        $area.fluxxCardLoadContent(req);
      });
    },
    fluxxCardTitle: function() {
      return $.trim($('.title', this.fluxxCard()).text()).replace(/[\n\r\t]/g, '');
    },
    fluxxCardIconStyle: function(){
      var style =
         this.fluxxCardListing().attr('data-icon-style')
      || this.fluxxCardDetail().attr('data-icon-style')
      || '';
      $.fluxx.log('STYLE FOR ICON IS ' + style);
      return style;
    },
    fluxxCardAreaURL: function(options) {
      var options = $.fluxx.util.options_with_callback({without: []},options);
      var current = this.fluxxCardAreaRequest();
      var withoutNames = _.pluck(options.without, 'name');
      $.fluxx.log('withoutNames', withoutNames);
      var params  = _.reject(current.data, function(elem) {
        return _.indexOf(withoutNames, elem.name) == -1 ? false : true;
      });
      /* Remove anything from current.data that's in options.without */
      return current.url + '?' + $.param(params);
    },
    fluxxCardAreaData: function() {
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
          $.fluxx.log("Setting data-" + key + " = " + val);
        });
        $.fluxx.log("Settings are complete!!!!!!!!!! [[[[["+$area.fluxxCard().fluxxCardIconStyle()+"]]]]]");
      });
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
      
      if ($area.attr('data-has-drawer')) {
        var $tabs = $('.info .tabs', $area.fluxxCard()), $sections = $('.drawer .section', $area.fluxxCard());
        $tabs.html($sections.clone());
        $('.info', $area.fluxxCard()).removeClass('open');
      }
      
      $('.datetime input', $area).datepicker();
      $.fluxx.util.autoGrowTextArea($('textarea', $area));
      $('.multiple-select-transfer select[multiple=multiple]').selectTransfer();
      
      $('.header .notice:not(.error)').delay(2000).find('.close-parent').click();
      
      $('.partial[data-refresh-onload=1]', $area).refreshAreaPartial({
        animate: false
      });
      
      return this;
    },
    openListingFilters: function() {
      $.fluxx.log("**> openListingFilters");
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
          },
        }, function () {
          _.each($listing.fluxxCardAreaRequest().data, function(obj) {
            if (obj.value) {
              var selector = '[name*=' + obj.name + ']';
              var $elem = $(selector, $filters);
              $elem.val(obj.value);
              $(selector + ":checkbox", $filters)
                .attr('checked', true)
                .change(function () {
                  $(selector + ":hidden", $filters).val(this.checked ? this.value : "");
                });
              $.fluxx.log("---", selector, $elem.length, obj.value);
            }
          });
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
              closeButton: true
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
                  targetHeight = options.target.outerHeight(true),
                  arrowHeight = $arrow.outerHeight(true);
              $arrow.css({
                top: parseInt(targetPosition - (arrowHeight/2 - targetHeight/2))
              });
              var parentOffset = (
                  //    options.target.css('float') || options.target.parent().css('float')
                  //  ? 
                      options.target.position().left + (options.target.fluxxCardListing().is(':visible') ? options.target.fluxxCardListing().outerWidth(true) : 0)
                  //  : 
                  //    options.target.offsetParent().position().left
                  ),
                  targetWidth  = options.target.outerWidth(true),
                  arrowWidth   = $arrow.outerWidth(true) / 2,
                  leftPosition = parentOffset + targetWidth + arrowWidth;
              $modal.css({
                left: parseInt(leftPosition)
              });
              totalWidth = parseInt(leftPosition) + $modal.outerWidth(true);
              $.fluxx.log({po: parentOffset, tw: targetWidth, aw: arrowWidth, lp: leftPosition, mw: $modal.outerWidth(true), bw: $('.body:first', options.target.fluxxCardArea()).outerWidth(true), totalWidth: totalWidth});
              overage = totalWidth - $('.card-body:first', options.target.fluxxCard()).outerWidth(true);
              $.fluxx.log('overage: ' + overage);
              if (overage > 0) {
                $modal.fluxxCard().css({marginRight: overage});
              }
              $card.resizeFluxxCard();
              $.my.stage.resizeFluxxStage();
            }
          },
          function(e) {
            $card.resizeFluxxCard();
            $.my.stage.resizeFluxxStage();
          }
        );
      });
    },
    closeCardModal: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback({url: null, header: 'Modal', target: null},options, onComplete);
      return this.each(function(){
        var $modal = $('.modal', $(this).fluxxCard());
       $('.loading-indicator', $modal.fluxxCard()).removeClass('loading')
       var $card = $modal.fluxxCard();
        $modal.data('target').enableFluxxArea();
        $(this).fluxxCard().css({marginRight: null});
        $modal.remove();
        $card.resizeFluxxCard();
        $.my.stage.resizeFluxxStage();
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
      $.fluxx.log("**> fluxxAreaUpdate");
      var $area     = $(e.target),
          seen      = $area.data('updates_seen') || [],
          areaType  = $area.attr('data-type'),
          updates   = _.reject(updates, function(m) {return _.include(seen, m.model_id)}),
          nextEvent = areaType + '_update.fluxx.area';
    
//      $area.data('updates_seen', _.flatten([seen, _.pluck(updates, 'model_id')]));
//      $area.data('latest_updates', _.pluck(updates, 'model_id'));

      $area.trigger(nextEvent, [updates]);
    },
    fluxxListingUpdate: function(e, updates) {
      $.fluxx.log("**> fluxxListingUpdate");
      var $area   = $(e.target),
          filters = _.arrayToObject($area.fluxxCardAreaData(), function(entry) {
                            var entry = _.clone(entry);
                            if (entry.name) {                         
                              var match = entry.name.match(/\[(\w+)\]/);
                              if (match) {
                                entry.name = match[1];
                              }
                            }
                            return entry;
                          }),
          updates = _.select(updates, function(update){
                        var delta   = $.parseJSON(update.delta_attributes),
                            isMatch = _.isFilterMatch(filters, delta);
                        $.fluxx.log("=== CHECKING FOR MATCH ===", filters, delta, isMatch, "===");
                        return isMatch;
                    });
      if (!updates.length) return;
      var model_ids = _.pluck(updates, 'model_id');
      $area.data('updates_seen', _.flatten([$area.data('updates_seen') || [], model_ids]));
      $area.data('latest_updates', model_ids);
      
      $.fluxx.log("-=-=-=-=-=-=-=-","fluxxListingUpdate",{card:$area.fluxxCard().attr('id'),seen:$area.data('updates_seen'),latest_updates:$area.data('latest_updates'),updates:updates},"-=-=-=-=-=-=-=-");
      $.fluxx.log('--- $area and $card length ---', $area.length, $area.fluxxCard().length, '---');
      $area.fluxxCard().trigger('update.fluxx.card', [_.size(model_ids), 'fluxxListingUpdate']);
    },
    getFluxxListingUpdate: function (e) {
      $.fluxx.log("**> getFluxxListingUpdate");
      var $area = $(this);
      var updates = $area.data('updates_seen');
      if (_.isEmpty(updates)) return;
      var req  = $area.fluxxCardAreaRequest();
      $.extend(
        true,
        req,
        {
          data: {
            id: updates,
            find_by_id: true
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
            $area.data('updates_seen', []);
            delete _.last($('.listing:first').data('history')).data.id;
            $area.fluxxCard().trigger('update.fluxx.card', [-1 * $entries.length, 'getFluxxListingUpdate'])
          }
        }
      );
      req.data = _.objectWithoutEmpty(req.data);
      // FLX-27
      // Filtered cards are randomly showing records as new (orange line) when updated.
      // The req.data object is an array of objects ({name: "xxx", value: "xxx"}) when a filter is set
      if (req.data instanceof Array) {
        req.data.push({name: 'find_by_id', value: true});
        req.data.push({name: 'id', value: updates});
      }
      $.ajax(req)
      if (req.data instanceof Array) {
        req.data.pop();
        req.data.pop();
      }
    },
    
    /* Data Loaders */
    fluxxCardLoadContent: function (options, onComplete) {
      $.fluxx.log("**> fluxxCardLoadContent");
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
        options.area.hide().trigger('complete.fluxx.area');
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
            options.area.fluxxCardLoadContent(opts);
          } else {
            options.area.show();
            var $document = $('<div/>').html(data);
            $('.header', options.area).html(($('#card-header', $document).html() || options.header).trim());
            $('.body',   options.area).html(($('#card-body',   $document).html() || options.body).trim());
            $('.footer', options.area).html(($('#card-footer', $document).html() || options.footer).trim());
            $('.drawer', options.area.fluxxCard()).html(($('#card-drawer', $document).html() || '').trim());
            $('.header,.body,.footer', options.area).removeClass('empty').filter(':empty').addClass('empty');
            if (options.area.attr('data-has-drawer')) {
              if ($('.drawer', options.area.fluxxCard()).filter(':empty').length) {
                $('.drawer', options.area.fluxxCard()).parent().addClass('empty');
              } else {
                $('.drawer', options.area.fluxxCard()).parent().removeClass('empty');              
              }
            }
            options.area
              .fluxxAreaSettings({settings: $('#card-settings', $document)})
              .trigger('complete.fluxx.area')
              .trigger('lifetimeComplete.fluxx.area');
          }
        },
        error: function(xhr, status, error) {
          options.area.show();
          var $document = $('<div/>').html(xhr.responseText);
          $('.header', options.area).html('');
          $('.body', options.area).html($document);
          $('.footer', options.area).html('');
          $('.drawer', options.area.fluxxCard()).html(($('#card-drawer', $document).html() || '').trim());
          $('.header,.body,.footer', options.area).removeClass('empty').filter(':empty').addClass('empty');
          if ($('.drawer', options.area.fluxxCard()).filter(':empty').length) {
            $('.drawer', options.area.fluxxCard()).parent().addClass('empty');
          } else {
            $('.drawer', options.area.fluxxCard()).parent().removeClass('empty');              
          }
          options.area
            .trigger('complete.fluxx.area')
            .trigger('lifetimeComplete.fluxx.area');
        },
        beforeSend: function() { $('.loading-indicator', options.area.fluxxCard()).addClass('loading') },
        complete: function() { $('.loading-indicator', options.area.fluxxCard()).removeClass('loading') }
      });
      
      return this;
    },
    
    fluxxCardLoadListing: function (options, onComplete) {
      $.fluxx.log("**> fluxxCardLoadListing");
      var options = $.fluxx.util.options_with_callback({area: this.fluxxCardListing()},options,onComplete);
      return this.fluxxCardLoadContent(options);
    },
    
    fluxxCardLoadDetail: function(options, onComplete) {
      $.fluxx.log("**> fluxxCardLoadDetail");
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
          position: function($card) { $card.appendTo($.my.hand) },
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
              '</div>',
              '<div class="info">',
                '<div class="scroller"><span>scroll tabs</span> <a href="#" class="tabs-left">&laquo;</a> <a href="#" class="tabs-right">&raquo;</a></div>',
                '<ol class="tabs"></ol><ol class="drawer"></ol>',
              '</div>',
            ]));
        },
        loadingActions: {
          close: function(){
            this.closeCardModal();
          },
          refreshCaller: function(){
            if (! this.data('target')) return;
            $.fluxx.log("Refreshing caller after modal close");
            if (this.data('target').parent('.partial').length) {
              $.fluxx.log("Refreshing PARTIAL");
              this.data('target').refreshAreaPartial();
            } else {
              $.fluxx.log("Refreshing AREA");
              this.data('target').refreshCardArea();
            }
          },
          refreshNamed: function(){
            if (! this.data('target')) return;
            if (this.data('target').attr('target')) {
              $(this.data('target').attr('target'), this.data('target').fluxxCardArea()).refreshAreaPartial();
            }
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
        '<div class="icon"></div>',
        '<span class="title">',
          options.title,
        '</span>',
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
      '<div class="', types.join(' '), '" data-type="', options.type ,'" ', (options.drawer ? ' data-has-drawer="1" ' : null),
 ,'>',
        (options.closeButton ? ['<ul class="controls"><li><a href="#" class="close-modal">&times;</a></li></ul>'] : null),
        (options.arrow ? ['<div class="arrow ', options.arrow, '"></div>'] : null),
        '<div class="header"></div>',
        '<div class="body"></div>',
        '<div class="footer"></div>',
      '</div>'
    ];
  };
  
  $(window).resize(function(e){
    $.my.cards.resizeFluxxCard();
  }).resize();
})(jQuery);
