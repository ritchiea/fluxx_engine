 (function($){
  $.fn.extend({
    addFluxxCard: function(options, onComplete, fromClientStore) {
      $.fluxx.log("*******> addFluxxCard");
      if (!options.hasOwnProperty("listing") && !options.hasOwnProperty("detail"))
        return onComplete.call();
      var options = $.fluxx.util.options_with_callback($.fluxx.card.defaults, options, onComplete);
      return this.each(function(){
        var $card = $.fluxx.card.ui.call($.my.hand, options).hide();
        options.position($card);
        $card
          .data({
            listing:   $('.listing:eq(0)',   $card),
            detail:    $('.detail:eq(0)',    $card),
            minimized: $('.minimized:eq(0)',    $card),
            box:       $('.card-box:eq(0)',  $card),
            body:      $('.card-body:eq(0)', $card),
            fromClientStore: fromClientStore,
            locked:    (options.settings ? options.settings.locked : false)
          })
          .bind({
            'complete.fluxx.card': _.callAll(
              $.fluxx.util.itEndsHere,
              function(){$card.fadeIn('slow');},
              _.bind($.fn.editableCardTitle, $card),
              _.bind($.fn.subscribeFluxxCardToUpdates, $card),
              options.callback
            ),
            'lifetimeComplete.fluxx.card' :
              function() {
                var $close = $('.close-detail', $card);
                if ($('.detail:visible', $card).length > 0 &&
                    $('.listing:visible', $card).length > 0)
                  $close.show();
                else
                  $close.hide();
                if ($card.data('locked'))
                  $('.close-card', $card).hide();
                else
                  $('.close-card', $card).show();

                $refresh = $('.titlebar .refresh-card', $card).hide();
                if (!$card.fluxxCardListing().is(':visible') && !$card.cardIsMinimized())
                  $refresh.show();

                $editReport = $('.titlebar .edit-report-filter', $card).hide();
                if ($('.report-area', $card).length && !$card.cardIsMinimized())
                  $editReport.show();

                if ($card.data && $card.data('icon'))
                  $card
                  .setMinimizedProperties({info: $card.fluxxCardInfo()})
                  .data('icon').setDockIconProperties({
                    style: $card.fluxxCardIconStyle(),
                    popup: $card.fluxxCardInfo()
                  });
              },
            'load.fluxx.card': options.load,
            'close.fluxx.card': options.close,
            'minimize.fluxx.card': options.minimize,
            'unload.fluxx.card': options.unload,
            'update.fluxx.card': _.callAll(
              _.bind($.fn.updateFluxxCard, $card),
              options.update
            ),
            'click':
              function() {
                $card.data('fromClientStore', false);
              }
          });
        $.my.dock.addViewPortIcon({ card: $card });
        $card.fluxxCardMinimized().hide();
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
            _.bind($.fn.resizeFluxxCard, $card)();
            // Bring the card into focus if we are not restoring a dashboard after a page refresh
            if (!$card.fromClientStore() && !$card.cardFullyVisible())
              $('a', $card.data('icon')).click();
            if (options.hasOwnProperty('settings') && options.settings.minimized) {
              $card.trigger('minimize.fluxx.card');
            }
          })
        });
        $.my.cards = $('.card');
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
          $card.trigger('lifetimeComplete.fluxx.card');
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
        detail:  $card.fluxxCardDetail().fluxxCardAreaRequest() || {},
        // TODO remove function and use data
        settings: {minimized: $card.cardIsMinimized(),
                   locked: $card.data('locked')}
      };
    },
    subscribeFluxxCardToUpdates: function () {
      $.fluxx.log("**> subscribeFluxxCardToUpdates");
      return this.each(function(){
        if (!$.fluxx.realtime_updates) return;

        var $card = $(this);
        $.fluxx.realtime_updates.subscribe(function(e, data, status) {
         // $.fluxx.log("Found " + data.deltas.length + " deltas.");
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
//            $.fluxx.log("triggering update.fluxx.area["+$card.attr('id') + ' :: ' + model+"]: " + updates.length + " ("+$area.attr('class')+" "+ $area.fluxxCard().attr('id')+")")
            if (typeof updates == 'object' && updates.length) $area.trigger('update.fluxx.area', [updates]);
          });
        });
      });
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
          .trigger('close.fluxx.card')
          .trigger('unload.fluxx.card');
      });
      return this;
    },
    minimizeFluxxCard: function(options, onComplete) {
      $.fluxx.log("**> minimizeFluxxCard");
      var options = $.fluxx.util.options_with_callback({},options,onComplete);
      this.each(function(){
        $(this)
          .fluxxCard()
          .closeCardModal()
          .trigger('minimize.fluxx.card');
      });
      return this;
    },
    focusFluxxCard: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback({scrollEdge: ''},options,onComplete);
      var $card = $(this);
      var targetLeft = $card.offset().left;
      var margin = $card.fluxxCardMargin();
      var screenWidth = $(window).width();
      var scrollToRight = false;
      if (options.scrollEdge == 'right') {
        scrollToRight = true;
      } else if (options.scrollEdge != 'left') {
        var scrollMiddle = $(window).scrollLeft() + (screenWidth / 2);
        var targetMiddle = targetLeft  + ($card.outerWidth() / 2);
        scrollToRight = (scrollMiddle < targetMiddle);
      }
      var $modal = $('.modal:visible', $card);
      var adjust = 0;
      if ($modal.length > 0) {
        adjust = $modal.width() - ($card.offset().left + $card.width() - $modal.offset().left);
      }
      if (scrollToRight) {
        targetLeft = targetLeft - screenWidth + $card.width() + margin + adjust;
      } else {
        targetLeft = targetLeft - margin;
      }
      var distance = Math.abs($(window).scrollLeft() - targetLeft);
      //perform animated scrolling
      $('html,body').stop().animate({scrollLeft: targetLeft}, distance / 4, 'swing', function()
      {
        if (onComplete)
          onComplete.call();
      });
      return this
    },
    resizeFluxxCard: function(options, onComplete) {
      if (!$.my.hand || this.length < 1) return this;
      var options = $.fluxx.util.options_with_callback({},options,onComplete);
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
                $('.area', $box).filter(':visible').filter(function(){ return $(this).css('position') != 'absolute'; }),
                'outerWidth', true
              ) + 2
            );

            $('.area', $cardBody).height(
              $cardBody.height(
                $cardBody.parent().innerHeight() -
                _.addUp(
                  $cardBody
                    .siblings()
                    .filter(':visible')
                    .filter(function(){ return $(this).css('position') != 'absolute'; }),
                  'outerHeight', true
                )
              ).innerHeight()
            ).each(function(){
              var $area     = $(this),
                  $areaBody = $('.body', $area);
              if ($area.hasClass('modal') && $area.data('target')) {
                var $arrow = $('.arrow', $area);
                if ($card.height() - 8 < $area.data('target').offset().top - $('.card-header', $card).height())
                  $arrow.hide();
                else
                  $arrow.show();
                $area.height($card.height());
              }
              $areaBody.height(
                $areaBody.parent().innerHeight() -
                _.addUp(
                  $areaBody
                    .siblings()
                    .filter(':visible')
                    .filter(function(){ return $(this).css('position') != 'absolute'; }),
                  'outerHeight',
                  true
                )
              );
            })
          });

        // Size the minimized card area and center it in the available space
        $min = $('.minimized-info', $card);
        if ($min.length && $card.fluxxCardMinimized()) {
          $min.width($min.parent().height()).css('margin-top', $min.parent().height() + 'px');
          var padding = Math.floor(($card.fluxxCardMinimized().width() - $('ul', $min).height()) / 2) - 4;
          if (padding < 0)
            padding = 0
          $min.css({'padding-top': padding, 'padding-bottom': padding});
        }

        var $tabs = $('.tabs', $card);
        $tabs.width($('.drawer', $card).height() - ($('.info', $card).hasClass('open') ? 0 : 40));
        var tabsWidth = $tabs.width(), innerWidth = _.addUp($('.label', $tabs), 'outerWidth', true);
        if (($tabs.width() < _.addUp($('.label', $tabs), 'outerWidth', true)) && $tabs.is(':visible')) {
					if ($tabs.scrollTop() == 0)
						$('.tabs-left', $card).addClass('disabled');
					else
						$('.tabs-left', $card).removeClass('disabled');
					if ($tabs.attr("scrollHeight") - $tabs.scrollTop() - 5 == $tabs.outerHeight())
						$('.tabs-right', $card).addClass('disabled');	
					else
						$('.tabs-right', $card).removeClass('disabled');	
          $('.info .scroller', $card).show();
        } else {
          $('.info .scroller', $card).hide();
        }
        var cardWidth = _.addUp(
            $card
              .children()
              .filter(':visible')
              .filter(function(){ return $(this).css('position') != 'absolute'; }), 'outerWidth', false);
// Hard coding 12 pixels in for tab width to force a smaller margin between cards when tabs are visible
// original calculation below
//            + ($('.drawer', $card).parent().filter(':visible').outerWidth(true));

        if ($('.drawer', $card).is(':visible')) {
          cardWidth += $('.drawer', $card).parent().filter(':visible').outerWidth(true);
        } else if ($('.drawer', $card).parent().is(':visible')) {
          cardWidth += 12;
        }
				if ($card.width() != cardWidth)
        	$card.width(cardWidth);
      });
			_.bind($.fn.resizeFluxxStage, $.my.stage)();
    },
    closeDetail: function() {
      var $card = this.fluxxCard();
      // For some reason executing fadeOut on both tabs and detail at the same time causes
      // modal windows opened in the detail area to be clipped later on.
      // Workaround is to animate separately.
      $('.detail', $card).fadeOut();
      $('.tabs', $card).fadeOut( function() {
        $('.drawer', $card).parent().addClass('empty');
        // include the width of the .card-box border or the card header and footer will be too small
        newWidth = $card.fluxxCardListing().width() + parseInt($('.card-box', $card).css('border-left-width')) + parseInt($('.card-box', $card).css('border-right-width'));
        $card.closeCardModal().animateWidthTo(newWidth, function() {
          $card.fluxxCardDetail().hide();
          $card.trigger('lifetimeComplete.fluxx.card');
          $card.width(newWidth);
          $('.tabs', $card).show();
        });
        $card.fluxxCardDetail().fluxxCardArea().data('history')[0] = {};
        $('.show', $card.fluxxCardDetail()).remove();

        $card.saveDashboard();
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
    refreshAreaPartial: function(options, onComplete){
      $.fluxx.log("**> refreshAreaPartial");
      var options = $.fluxx.util.options_with_callback({animate: true}, options, onComplete);
      return this.each(function(){
        // if the current context has a data-src attribute, we assume it is a partial.
        // By doing this we really don't need to give a specific area the partial class when
        // targeting it using the "refreshNamed" action.
        var $partial = ($(this).attr('data-src') ? $(this) : $(this).fluxxCardPartial());
        if (options.animate) {
          $.ajax({
            url: $partial.attr('data-src'),
            beforeSend: function() {
              $partial
                .addClass('updating')
                .children()
                .fadeTo(300, 0);
            },
            success: function(data, status, xhr){
              $partial.html($(data)).removeClass('updating').children().fadeIn();
              if (onComplete)
                onComplete();
            }
          });
        } else {
          $.ajax({
            url: $partial.attr('data-src'),
            success: function(data, status, xhr){
              $partial.html(data);
              if (onComplete)
                onComplete();
            }
          });
        }
      });
    },
    refreshCardArea: function(onComplete){
      return this.each(function(){
        var $area = $(this).fluxxCardArea();
        $.fluxx.log("*******>refreshCardArea ", '  '+$area.fluxxCard().attr('id'), '    ' + $area.attr('class'));
        var req = $area.fluxxCardAreaRequest();
        if (req) {
          $.extend(req, {area: $area});
          $area.fluxxCardLoadContent(req, onComplete);
        }
      });
    },
    setMinimizedProperties: function(options) {
      var options = $.fluxx.util.options_with_callback({info: []}, options);
      var $body = $('.body', $(this).fluxxCardMinimized());
      $min = $('<div class="minimized-info"><ul><li class="minimized-title">' + options.info.join('</li><li>') + '</li></ul></div>');
      $body.html($min).fluxxCard().resizeFluxxCard();
      return this;
    },
    fluxxCardTitle: function() {
      return $.trim($('.titlebar .title', this.fluxxCard()).text()).replace(/[\n\r\t]/g, '');
    },
    fluxxCardInfo: function() {
      var $card = $(this);
      var info = [$card.fluxxCardTitle()];
      var filter = $card.fluxxCardFilterText();
      var search =  $('.filter', $card).val();
      var detail;
      if ($('.detail', $card).length) {
          var $pulls = $('.detail .show .minimize-detail-pull', $card);
          if (!$pulls.length) $pulls = $('.detail h1:first', $card);
          var text = [];
          $pulls.each(function(){ text.push($(this).text()) });
          detail = text.join(' ');
      }
      var concat = [];
      if (filter)
        concat.push('<strong>Filters:</strong> ' + filter);
      if (search)
        concat.push('<strong>Search:</strong> ' + search);
      if (concat.length)
        info.push('<span>' + concat.join() + '</span>');
      if (detail)
        info.push('<span><strong>Detail:</strong> ' + detail + '</span>');

      return info;
    },
    fluxxCardFilterText: function() {
      var $card = $(this).first();
      var filterText;
      if ($card.fluxxCardListing().fluxxCardAreaRequest())
        _.each($card.fluxxCardListing().fluxxCardAreaData(), function(obj) {
          if (obj.name && obj.name == 'filter-text')
            filterText = obj.value
        });
      return filterText;
    },
    fluxxCardIconStyle: function(){
      var style =
         this.fluxxCardListing().attr('data-icon-style')
      || this.fluxxCardDetail().attr('data-icon-style')
      || '';
      return style;
    },
    cardFullyVisible: function() {
      var $card = $(this).first(),
      cardLeft = $card.offset().left,
      scroll = $(window).scrollLeft();
      return ((scroll <= cardLeft) && $card.cardVisibleRight());
    },
    cardVisibleRight: function() {
      var $card = $(this).first(),
        $modal = $('.modal:visible', $card),
        scroll = $(window).scrollLeft(),
        cardLeft = $card.offset().left,
        cardWidth = $card.width() + $card.fluxxCardMargin() +
          ($modal.length > 0 ? $modal.width() - ($card.offset().left + $card.width() - $modal.offset().left) : 0 ),
        cardRight = cardLeft + cardWidth;
        return ((cardRight <= scroll + $(window).width()) && (cardRight >= scroll));
    },
    fluxxCardAreaURL: function(options) {
      var options = $.fluxx.util.options_with_callback({without: []},options);
      var current = this.fluxxCardAreaRequest();
      if (current.data &&  typeof current.data == 'object') {
        var withoutNames = _.pluck(options.without, 'name');
        var params  = _.reject(current.data, function(elem) {
          return _.indexOf(withoutNames, elem.name) == -1 ? false : true;
        });
        /* Remove anything from current.data that's in options.without */
        return current.url + '?' + $.param(params);
      } else {
        return current.url + '?' + current.data;
      }
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
    fluxxCardMinimized: function() {
      return this.fluxxCard().data('minimized');
    },
    fluxxCardBox: function () {
      return this.fluxxCard().data('box');
    },
    fluxxCardBody: function () {
      return this.fluxxCard().data('body');
    },
    fromClientStore: function (clearFlag) {
      return this.fluxxCard().data('fromClientStore');
    },
    fluxxCardMargin: function () {
      var $card = this.fluxxCard();
      if (!$.my.cards.hasOwnProperty('margin')) {
        $.my.cards.margin = $.fluxx.util.marginHeight($card);
      }
      return $.my.cards.margin / 2;
    },
    cardIsMinimized: function() {
      var $card = this.fluxxCard();
      return $('.titlebar', $card).attr('minimized') == 'true';
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
        });
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

      $('.datetime input', $area).datepicker({ changeMonth: true, changeYear: true });
      $.fluxx.util.autoGrowTextArea($('textarea', $area));
      $('.multiple-select-transfer select[multiple=true], .multiple-select-transfer select[multiple=multiple]', $area).selectTransfer();
      $('.add-another', $area).after($('<a class="do-add-another" href="#">+</a>'));
      if ($('.visualizations', $area).length)
        $area.addClass('report-area');

      $('.wysiwyg', $area).each(function() {
        var $elem = $(this);
        $elem.rte({
          content_css_url: '/stylesheets/fluxx_engine/lib/rte/css/rte.css',
          media_url: '/stylesheets/fluxx_engine/lib/rte/img/',
          buttons: $(this).data('wysiwyg-buttons').replace(/\s+/, '').split(',')
        });
      });

      var once = false;
      $('[data-trigger-field]', $area).each(function() {
        if (!once) {
          once = true;
          // Refresh dropdowns when closing a modal
          $area.fluxxCard().bind('close.fluxx.modal', function (e, $target, url) {
            // Capture the url returned from the create operation, this will contain the ID
            // of the newly created element.
            var $select = $target.parent().prev();
            var userID = url.match(/\/(\d+)$/);
            if (userID)
              userID = userID.pop();
            if ($select.length) {
              $select.change(function() {
                $select.unbind('change');
                // Only auto select a user if we have an ID
                if (userID)
                  $select.val(userID)
              });
              // Refresh user dropdowns
              $('[data-related-child]', $area).change();
            }
          });
        }
        var $link = $(this);
        $($link.attr('data-trigger-field'), $area).change(function () {
          var $elem = $(this);
          if ($elem.val()) {
            // Put the organization ID into the link to create a new user
            // TODO This field name should not be hardcoded
            $link.attr('href', $link.show().attr('href')
              .replace(/([\&\?])user\[temp_organization_id\]=\n*/, "$1user[temp_organization_id]=" + $elem.val()));
          } else {
            // Hide "add new" links if no organization is selected
            $link.hide();
          }
        }).change();
      });

      $('.header .notice:not(.error)').delay(2000).find('.close-parent').click();

      $('.partial[data-refresh-onload=1]', $area).refreshAreaPartial({
        animate: false
      });

      return this;
    },
    openListingFilters: function(openInDetail) {
      $.fluxx.log("**> openListingFilters");
      return this.each(function(){
        var $card    = $(this).fluxxCard(),
            $listing = (openInDetail ? $card.fluxxCardDetail() : $card.fluxxCardListing());
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
          $('.date input', $filters).datepicker({ changeMonth: true, changeYear: true });
          // Construct the human readable filter text
          var $form = $('form', $filters).submit(
            function() {
              $('input,select', $form).removeAttr("disabled");
              var criterion = [];
              $filterText.val('');
              $card.data('locked', $('#lock-card').attr('checked'));
              $filters.find(':input').each(function(index, elem) {
                var $elem = $(elem);
                var id = $elem.attr('id');
                var val = $elem.val();
                if (val) {
                  var label = $('[for*=' + id + ']', $filters).text();
                  label = label.replace(/:$/, '');
                  var type = $elem.attr('type');
                  if (type == 'checkbox') {
                    if ($elem.attr('checked') == true)
                      criterion.push(label);
                  } else if (type == 'select-one') {
                    criterion.push($("option[value='" + val + "']", $elem).text());
                  } else if (type == 'text') {
                    criterion.push(val);
                  }

                  // Pass multi value form fields so that rails recognizes them as an array
                  if ($elem.hasClass('add-another'))
                    $elem.attr('name', $elem.attr('name') + '[]')
                }
              });
              $filterText.val(criterion.join(', '));
            });
          var $lock = $('<li class="boolean optional lock-card"><label for="lock-card"><input id="lock-card" type="checkbox"' +
            ($card.data('locked') ? ' checked="true"' : '') +
            '(>Lock Card</label></li>').prependTo($form);
          $lock.change(function() {
            if ($('#lock-card', $lock).attr('checked')) {
              $form.addClass('locked');
              $('a.do-add-another', $form).removeClass('do-add-another').addClass('do-add-another-disabled');
              $('input,select', $form).not('#lock-card').attr("disabled", "disabled");
            } else {
              $form.removeClass('locked');
              $('a.do-add-another-disabled', $form).removeClass('do-add-another-disabled').addClass('do-add-another');
              $('input,select', $form).not('#lock-card').removeAttr("disabled");
            }
          }).change();

          var $filterText = $('<input type="hidden" name="filter-text" value =""/>').appendTo($form);

          var found = {};

          var data = $listing.fluxxCardAreaRequest().data;
          if (typeof data == "string") {
            $form.removeClass('to-listing').addClass('to-detail');
            data = [];
            _.each($.fluxx.unparam($listing.fluxxCardAreaData()), function(val, key) {
              if ($.isArray(val)) {
                _.each(val, function(singleValue) {
                  data.push({name: key, value: singleValue});
                });
              } else {
                data.push({name: key, value: val});
              }
            });
          }
          _.each(data, function(obj) {
            if (obj.value) {
              var selector = '[name*=' + obj.name + ']';
              var $elem = $(selector, $filters).last();
              if (found.hasOwnProperty(obj.name)) {
                var $add  = $elem.clone();
                $elem.after($add);
                $add.before($('<label/>'));
                $elem = $add;
              }
              $elem.val(obj.value);
              $(selector + ":checkbox", $filters)
                .attr('checked', true)
                .change(function () {
                  $(selector + ":hidden", $filters).val(this.checked ? this.value : "");
                });
              if ($elem.hasClass('add-another'))
                found[obj.name] = true;
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
        $card.css('overflow', 'visible');
        $card.data('lastMarginRight', $card.css('marginRight'));
        var $modal = $($.fluxx.util.resultOf(
            $.fluxx.card.ui.area,
            {
              type: 'modal',
              arrow: 'left',
              closeButton: true
            }
        )).data({url: options.url, target: options.target});
        $card.fluxxCardLoadContent(
          {
            area: $modal,
            url: options.url,
            header: '<span>' + options.header + '</span>',
            caller: options.target,
            init: function(e) {
              $modal.appendTo($card.fluxxCard()).css('opacity', '0.1');
              $('.area', $card).not('.modal').disableFluxxArea();
              var $arrow = $('.arrow', $modal);
              var aftPosition = options.target.parent().hasClass('inline-aft');
              var target = (aftPosition ? options.target.parent().parent() : options.target);
              var targetPosition = target.position().top,
                  targetHeight = target.outerHeight(true),
                  arrowHeight = $arrow.outerHeight(true);
              var headerHeight = $('.card-header', $card).height();
              $arrow.css({
                top: parseInt(targetPosition - (arrowHeight/2 - targetHeight/2)) + headerHeight + 10
              });

              var parentOffset = (
                  //    options.target.css('float') || options.target.parent().css('float')
                  //  ?
                      target.position().left + (options.target.fluxxCardListing().is(':visible') ? options.target.fluxxCardListing().outerWidth(true) : 0)
                  //  :
                  //    options.target.offsetParent().position().left
                  ),
                  targetWidth  = target.outerWidth(true) - (aftPosition ? options.target.outerWidth(true) : 0),
                  arrowWidth   = $arrow.outerWidth(true) / 2,
                  leftPosition = parentOffset + targetWidth + arrowWidth;
              $modal.css({
                left: parseInt(leftPosition),
                top: -headerHeight + 46
              });
              totalWidth = parseInt(leftPosition) + $modal.outerWidth(true);
              overage = totalWidth - $('.card-body:first', options.target.fluxxCard()).outerWidth(true);
              if (overage > 0)
                $modal.fluxxCard().css({marginRight: overage});
              $card.resizeFluxxCard();
              $.my.stage.resizeFluxxStage();
            }
          },
          function(e) {
            $modal.fadeTo('slow', 1);
            $card.resizeFluxxCard();
            $.my.stage.resizeFluxxStage();
          }
        );
      });
    },
    closeCardModal: function(options) {
      var options = $.fluxx.util.options_with_callback({url: null, header: 'Modal', target: null},options);
      return this.each(function(){
        var $modal = $('.modal', $(this).fluxxCard());
        if ($modal.length > 0) {
          $modal.fadeOut(function() {
            var $card = $modal.fluxxCard();
            $('.area', $card).enableFluxxArea().trigger('close.fluxx.modal', [$modal.data('target'), $modal.data('url')]);
            $card.animate({marginRight: $card.data('lastMarginRight')}, function() {
              $modal.remove();
              $card.resizeFluxxCard();
              $.my.stage.resizeFluxxStage();
            });
          });
        }
      });
    },
    disableFluxxArea: function () {
      return this.each(function(){
        $(this).fluxxCardArea().addClass('disabled')
          .bind('click', function(e) {
            $.fluxx.util.itEndsWithMe(e);
          });
          // TODO Disable scrolling
      });
    },
    enableFluxxArea: function () {
      return this.each(function(){
        $(this).fluxxCardArea().removeClass('disabled')
          .unbind('click');
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
      var req  = {url: $area.fluxxCardAreaRequest().url};

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
            delete _.last($('.listing:first', $area.fluxxCard()).data('history')).data.id;
            $area.fluxxCard().trigger('update.fluxx.card', [-1 * $entries.length, 'getFluxxListingUpdate'])
          }
        }
      );

      $.ajax(req);
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
        lifetimeComplete: $.noop,
        /* onSuccess for create or update */
        onSuccess: function(e) {
          var $area = $(this);

          if (!$area.data('target'))
            return false;

          var onSuccess = $area.data('target').attr('data-on-success'),
              closeCard = false;
          // If we have onSuccess actions, execute them
          if (onSuccess) {
            _.each(onSuccess.replace(/\s/g, '').split(/,/), function(action){
              var func = $.fluxx.card.loadingActions[action] || $.noop;
              // Return a flag if we have closed this card so that continued loading stops
              if (action == 'close')
                closeCard = true;
              (_.bind(func, $area))();
            });
          }
          return closeCard;
        }
      };
      var options = $.fluxx.util.options_with_callback(defaults,options,onComplete);
      options.area
        .unbind('init.fluxx.area')
        .bind('init.fluxx.area', _.callAll(
          $.fluxx.util.itEndsHere,
          options.init
        )).trigger('init.fluxx.area')
        .data('url', options.url);

      options.area
        .unbind('complete.fluxx.area')
        .bind('complete.fluxx.area', _.callAll(
          $.fluxx.util.itEndsWithMe,
          _.bind($.fn.areaDetailTransform, options.area),
          _.bind($.fn.resizeFluxxCard, options.area.fluxxCard()),
          options.callback,
          function() {
            // Render render visualizations if available.
            // This needs to run after the callback in order for
            // charts to render correctly.
            if ($.fluxx.hasOwnProperty('visualizations')) {
              $('.chart', options.area).renderChart();
            }
          }
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

			// Don't send empty form variables if the form has class "ingnore-empty"
			var data = options.data;
			if ($(this).hasClass('ignore-empty')) {
				data = _.objectWithoutEmpty(options.data, ['filter-text']);
		  }

      $.ajax({
        url: options.url,
        type: options.type,
        data: data,
        success: function (data, status, xhr) {
          if (xhr.status == 201) {

            // Store the redirect URL for cases where we need to figure out what was created or updated
            options.area.data('url', xhr.getResponseHeader('Location'));

            var closeCard = false;
            // If we have a response indicating a successful operation,
            // run the onSuccess actions.
            if (xhr.getResponseHeader('fluxx_result_success'))
              closeCard = _.bind(options.onSuccess, options.area)();

            // If one of the loading operations was a close, don't proceed
            if (!closeCard) {
              var opts = $.extend(true, options, {type: 'GET', url: xhr.getResponseHeader('Location')});
							opts.data = [];
              options.area.fluxxCardLoadContent(opts);
            }
          } else {
            var complete = function () {
							// Don't try and render an entire document, forcing the page to be overwritten
							if (data.search("<html>") != -1)
								return;
              var $document = $('<div/>').html(data);
              var header = ($('#card-header', $document).html() && $('#card-header', $document).html().length > 1 ?
                $('#card-header', $document).html() : options.header);
              $('.header', options.area).html($.trim(header));
              $('.body',   options.area).html($.trim($('#card-body',   $document).html() || options.body));
              $('.footer', options.area).html($.trim($('#card-footer', $document).html() || options.footer));
              $('.drawer', options.area.fluxxCard()).html($.trim($('#card-drawer', $document).html() || ''));
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
                .trigger('complete.fluxx.area').trigger('lifetimeComplete.fluxx.area');
            }
            var $card = options.area.fluxxCard();
            if (options.area.fluxxCardAreaRequest())
              options.area.attr('data-src', options.area.fluxxCardAreaRequest().url);
            if (!options.area.is(':visible') && options.area.width() > 0) {
              $card.animateWidthTo($card.width() + options.area.width(), function() {
                // Wait a bit before displaying content to avoid an animation jump
                setTimeout(function () {
                  options.area.fadeIn(1000);
                  complete();
                }, 50);
                if (!$card.cardVisibleRight())
                  $card.focusFluxxCard({scrollEdge: 'right'});
              // Animate the card width an additional 12 pixels to account for connected data tabs.
              // This helps prevent a jump when the tabs are displayed
              }, null, (options.area.attr('data-has-drawer') ? 12 : 0));
            } else {
              if (!$card.cardVisibleRight())
                $card.focusFluxxCard({scrollEdge: 'right'});
              complete();
            }
          }
        },
        error: function(xhr, status, error) {
          options.area.show();
          var $document = $('<div/>').html(xhr.responseText);
          $('.header', options.area).html('');
          $('.body', options.area).html($document);
          $('.footer', options.area).html('');
          $('.drawer', options.area.fluxxCard()).html($.trim($('#card-drawer', $document).html() || ''));
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
        beforeSend: function() { options.area.fluxxCard().showLoadingIndicator() },
        complete: function() { options.area.fluxxCard().hideLoadingIndicator() }
      });

      return this;
    },
		showLoadingIndicator: function() {
			$('.loading-indicator', $(this)).addClass('loading');
		},
		hideLoadingIndicator: function() {
			$('.loading-indicator', $(this)).removeClass('loading');
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
    },
    animateWidthTo: function (widthTo, callback, speed, additonalCardWidth) {
      $.my.stage.animating = true;
      if (typeof speed == 'undefined')
        speed = 400;
      if (typeof additonalCardWidth == 'undefined')
        additonalCardWidth = 0;
      var $card = this;

      if (widthTo < 300)
        $('.title', $card).hide();

      // Prevent last card from wrapping and falling below the stage
      if ($card.outerWidth() < widthTo)
        $('#card-table').width( $('#stage').width() + widthTo);

      var $box = $('.card-box', $card);
      // Workaround to prevent the bottom dropshadow from disappearing when the card is animating
      $card.height($card.height() + 20);
      $card.animate({width: widthTo + additonalCardWidth}, speed);
      // Add 10 to the card-box width initially as the animation momentarily shrinks the
      // card by a few pixels, unexplainably
      $box.width($box.width() + 10).animate({width: widthTo}, speed, 'swing', function() {
        $('.title', $card).show();
        $('#card-table').width('100%')
        $card.height($card.height() - 20);
        $.my.stage.animating = false;
        $.my.stage.resizeFluxxStage();
        return _.bind(callback, $card)();
      });
    }
  });

  $.extend(true, {
    fluxx: {
      card: {
        defaults: {
          title: 'New Card',
          load: $.noop,
          close: $.noop,
          unload:
            function($card) {
              if ($card) {
                $card = $(this);
                $.my.stage.animating = true;
                $card.animate({opacity: 0}, 250, function() {
                  $card.animate({'margin-right': -$card.outerWidth(true)}, function() {
                    $card.remove();
                    $.my.cards = $('.card');
                    $.my.stage.animating = false;
                    $.my.stage.resizeFluxxStage({animate: true});
                    $card.saveDashboard();
                  });
                });
              }
            },
          minimize:
            function($card) {
              if ($card) {
                $card = $(this);
                var $titlebar = $('.titlebar', $card);
                if ($card.cardIsMinimized()) {
                  var cw = $card.data('lastWidth');
                  if (cw == 0)
                    cw = _.addUp($('.area[minimized=true]', $card), 'outerWidth', true);
                  $card.fluxxCardMinimized().fadeOut('fast', function() {
                    $card.animateWidthTo(cw, function() {
                      $titlebar.attr('minimized', 'false');
                      $('.maximize-card', $card).removeClass('maximize-card').addClass('minimize-card');
                      $('.title', $card).show();
                      $card.fluxxCardMinimized().hide();
                      $('.footer', $card).css('opacity', 1);
                      $('.area, .info', $card).filter('[minimized=true]').fadeIn('slow').attr('minimized', 'false');;
                      $card.resizeFluxxCard();
                      $card.trigger('lifetimeComplete.fluxx.card');
                      if (!$card.fromClientStore() && !$card.cardFullyVisible())
                        $('a', $card.data('icon')).click();
                      // Charts that load minized don't render do to issues with the plotting library
                      // renderChart will only render a chart once.
                      $('.chart', $card).renderChart();
                      $card.saveDashboard();
                    });
                  });
                } else {
                  var timeout = ($card.data('fromClientStore') ? 0 : 600);
                  $card.data('lastWidth', $card.width());
                  listingVisible = $('.listing', $card).is(':visible');
                  detailVisible = $('.detail', $card).is(':visible');
                  $('.detail, .tabs, .filters, .listing', $card).fadeOut(timeout);
                  setTimeout(function() {
                    $card.animateWidthTo($card.fluxxCardMinimized().width() + 2, function() {
                      $('.tabs, .filters', $card).show();
                      if (listingVisible)
                        $('.listing', $card).show();
                      if (detailVisible)
                        $('.detail', $card).show();
                      $titlebar.attr('minimized', 'true');
                      $('.minimize-card', $card).removeClass('minimize-card').addClass('maximize-card');
                      $('.title', $card).hide();
                      $('.footer', $card).css('opacity', 0);
                      $('.area, .info', $card).filter(':visible').hide().attr('minimized', 'true');
                      $card.fluxxCardMinimized().fadeIn('slow');
                      $('.card-body', $card).css('opacity', 1);
                      $card.resizeFluxxCard();
                      $card.trigger('lifetimeComplete.fluxx.card');
                      $card.saveDashboard();
                    }, timeout);
                  }, timeout + 10);
                }
              }
            },
          update: $.noop,
          position: function($card) { $card.appendTo($.my.hand);},
          listing: {
            url: null
          },
          detail: {
            url: null
          },
          minimized: {
            url: null
          },
        },
        attrs: {
          'class': 'card ignore-empty',
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
                $.fluxx.util.resultOf($.fluxx.card.ui.area, $.extend(options,{type: 'minimized'})),
                  $.fluxx.util.resultOf($.fluxx.card.ui.area, $.extend(options,{type: 'listing'})),
                  $.fluxx.util.resultOf($.fluxx.card.ui.area, $.extend(options,{type: 'detail', drawer: true})),
                '</div>',
                '<div class="card-footer">',
                '</div>',
              '</div>',
              '<div class="info empty">',
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
            // Refresh the card area this modal was called from
            if (! this.data('target')) return;
            $.fluxx.log("Refreshing caller after modal close");
            var $target = this.data('target'),
                $this = this,
                $area = $target.fluxxCardArea(),
                // resetTarget will use the target elements href attribute to located
                // the new element after a refresh. This is needed because the original
                // element is removed from the DOM as new HTML as added after the ajax call.
                resetTarget = function() {
                  var href = $target.attr('href');
                  $this.data('target', $('[href=' + href + ']', $area));
                };
            if ($target.parents('.partial').length && $target.parents('.partial').attr('data-src')) {
              $.fluxx.log("Refreshing PARTIAL");
              $target.refreshAreaPartial({}, resetTarget);
            } else {
              $.fluxx.log("Refreshing AREA");
              $target.refreshCardArea(resetTarget);
            }
          },
          // Refresh a card area named in the target parameter of the element that launched this modal.
          //TODO: The original target becomes orphaned after the refresh. May want to implement
          // resetTarget like in refreshCaller
          refreshNamed: function(){
            if (! this.data('target')) return;
            if (this.data('target').attr('target')) {
              $(this.data('target').attr('target'), this.data('target').fluxxCardArea()).refreshAreaPartial();
            }
          },
          //Refresh the entire detail area
          //TODO: The original target becomes orphaned after the refresh. May want to implement
          // resetTarget like in refreshCaller
          refreshDetail: function(){
            if (! this.data('target')) return;
            this.data('target').refreshCardArea();
          },
          // Open a new detail only card
          openDetail: function() {
            if (! this.data('target')) return;
            var $elem = this.data('target'),
                $card = $elem.fluxxCard(),
                $modal = $('.modal', $card);

            var card = {
              detail: {url: this.data('url') + '/edit'},
              title: ($elem.attr('data-title') || $elem.text())
            };
            if ($elem.attr('data-insert') == 'after') {
              card.position = function($card) {$card.insertAfter($elem.fluxxCard())};
            } else if ($elem.attr('data-insert') == 'before') {
              card.position = function($card) {$card.insertBefore($elem.fluxxCard())};
            }
            $.my.hand.addFluxxCard(card);
          },
          // Populate an input field with the success value from a create operation in a modal
          populateField: function() {
            if (! this.data('target')) return;
            var $elem = this.data('target');
            var $card = $elem.fluxxCard();
            var lookupURL = this.data('target').attr('data-src');
            if (!lookupURL)
              lookupURL = $(this.data('target').attr('target')).attr('data-autocomplete');
            if (this.data('target').attr('target') && lookupURL) {
              $field = $(this.data('target').attr('target'), this.data('target').fluxxCardArea());
              var objectID = this.data('url').match(/\/(\d+)$/);
              if (objectID) {
                objectID = objectID.pop();
                var query = {'find_by_id': 'true', id: objectID};
                $.getJSON(lookupURL, query, function(data, status) {
                  data = data.pop();
                  // We need to do some special handling for autocomplete inputs
                  if ($field.attr('data-autocomplete')) {
                    // We need to strip " - headquarters" from the label we get back from the server if this an organization query
                    var name = (lookupURL == '/organizations.autocomplete' ? data.label.replace(/ - headquarters$/, '') : data.label);
                    $field.val(name).next().val(objectID).change();
                    var child = $field.attr('data-related-child');
                    if (child) {
                      var $child = $(child, $card);
                      if ($child.attr('data-required')) {
                        $child.empty();
                      } else {
                        $child.html('<option></option>');
                      }
                      $('<option></option>').val(data.value).html(data.label).appendTo($child);
                      $child.val($child.children().first().val()).trigger('options.updated').change();
                    }
                  } else {
                  $field.val(name);
                  }
                });
              }
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
      '<ul class="controls">',
        '<li class="first"><a href="#" class="close-detail"><-</a></li>',
        '<li><a href="#" class="minimize-card">-</a></li>',
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
        '<a href="#" class="edit-report-filter" title="Refresh Card">',
        '<img alt="Edit Filter" src="/images/fluxx_engine/theme/default/icons/cog_edit.png">',
        '</a>',
        '<a href="#" class="refresh-card" title="Refresh Card">',
        '<img alt="Refresh Card" src="/images/fluxx_engine/theme/default/icons/arrow_refresh.png">',
        '</a>',
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

})(jQuery);
