 (function($){
  $.fn.extend({
    addFluxxCard: function(options, onComplete, fromClientStore) {
      $.fluxx.log("*******> addFluxxCard");
      if ((options.hasOwnProperty("listing") && options.listing.url) || (options.hasOwnProperty("detail") && options.detail.url)) {
        var options = $.fluxx.util.options_with_callback($.fluxx.card.defaults, options, onComplete);
        return this.each(function(){
          var $card = $.fluxx.card.ui.call($.my.hand, options).hide();
          options.position($card);
          $card
            .data({
              uid: ((options && options.uid) ? options.uid : $.fluxx.dashboard.nextUid()),
              listing:   $('.listing:eq(0)',   $card),
              detail:    $('.detail:eq(0)',    $card),
              minimized: $('.minimized:eq(0)',    $card),
              box:       $('.card-box:eq(0)',  $card),
              body:      $('.card-body:eq(0)', $card),
              fromClientStore: fromClientStore,
              locked:    (options.settings ? options.settings.locked : false),
              emailNotifications: (options.settings ? options.settings.emailNotifications : false)
            })
            .bind({
              'complete.fluxx.card': _.callAll(
                $.fluxx.util.itEndsHere,
                function(){$card.fadeIn('slow').css('overflow', 'visible');},
                _.bind($.fn.editableCardTitle, $card),
                _.bind($.fn.subscribeFluxxCardToUpdates, $card),
                options.callback
              ),
              'lifetimeComplete.fluxx.card' :
                function() {
                  if ($card.data('emailNotifications')) {
                    $('.open-subscriptions img' ,$card).attr('src','/images/fluxx_engine/theme/default/icons/email_go.png');
                  } else {
                    $('.open-subscriptions img' ,$card).attr('src','/images/fluxx_engine/theme/default/icons/email.png');
                  }

                  var $close = $('.close-detail', $card);
                  var detailShowing = $('.detail:visible', $card).length > 0;
                  var listingShowing = $('.listing:visible', $card).length > 0;
                  if (detailShowing && listingShowing)
                    $close.show();
                  else
                    $close.hide();
                  if ($card.data('locked'))
                    $('.close-card', $card).hide();
                  else
                    $('.close-card', $card).show();

                  if ($card.isSpreadsheetCard())
                    $card.addClass('spreadsheet-card');
                  if ($card.isSummaryCard())
                    $card.addClass('summary-card');

                  if ((!$card.find('.edit')[0] && detailShowing) || $card.isSpreadsheetCard())
                    $('.to-fullscreen', $card).removeClass('disabled');
                  else
                    $('.to-fullscreen', $card).addClass('disabled');

                  var $refresh = $('.titlebar .refresh-card', $card).hide(),
                      $create = $('.titlebar .new-model', $card).hide();
                  if (!$card.fluxxCardListing().is(':visible') && !$card.cardIsMinimized())
                    $refresh.show();
                  else if ($card.fluxxCardListing().data('create-link') && !$card.cardIsMinimized()) {
                    $create.attr('class', 'new-model ' + $card.fluxxCardListing().data('create-link-class')).attr('href', $card.fluxxCardListing().data('create-link')).show();
                    if ($card.fluxxCardListing().data('create-link-title')) {
                      $create.attr('title', $card.fluxxCardListing().data('create-link-title'));
                    }
                  }

                  $editReport = $('.titlebar .edit-report-filter', $card).hide();
                  if (($('.report-area', $card).length && !$card.cardIsMinimized()))
                    $editReport.show();

                  if ($card.data && $card.data('icon'))
                    $card
                    .setMinimizedProperties({info: $card.fluxxCardInfo()})
                    .data('icon').setDockIconProperties({
                      style: $card.fluxxCardIconStyle(),
                      popup: $card.fluxxCardInfo()
                    });
                  $.my.stage.resizeFluxxStage();
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
          var params = [];
          options.listing = $.fluxx.cleanupRequest(options.listing);
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
      } else {
        return onComplete.call();
      }
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
        uid: $card.data('uid'),
        title:   $card.fluxxCardTitle(),
        listing: $card.fluxxCardListing() && $card.fluxxCardListing().fluxxCardAreaRequest() ? $card.fluxxCardListing().fluxxCardAreaRequest() : {},
        detail:  $card.fluxxCardDetail() && $card.fluxxCardDetail().fluxxCardAreaRequest() ? $card.fluxxCardDetail().fluxxCardAreaRequest() : {},
        settings: {
          minimized: $card.cardIsMinimized(),
          locked: $card.data('locked'),
          emailNotifications: ($card.data('emailNotifications') || false)
        }
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
      if (scrollToRight) {
        targetLeft = targetLeft - screenWidth + $card.width() + margin;
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
        if ($card.hasClass('admin-card'))
         return;
        $('.card-box', $card)
          .height(
            $.my.cards.height(
              $.my.hand.innerHeight() -
              $.fluxx.util.marginHeight($.my.cards) + 15
            ).innerHeight() - 15
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

        $('.table-scroller', $card).height($card.fluxxCardListing().height() - 73);
        $('.row-scroller', $card).height($card.fluxxCardListing().height());
        $card.find('.new-modal').trigger('refresh.fluxx.area');
      });
			_.bind($.fn.resizeFluxxStage, $.my.stage)();
    },
    closeDetail: function() {
      var $card = this.fluxxCard();
      if ($('.detail:visible', $card).length == 0)
        return;
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
          $card.css('overflow', 'visible');
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
      if (this.fluxxCardArea()) {
        var history = this.fluxxCardArea().data('history');
        if (_.isEmpty(history)) return null;
        var req = history[0];
        return {
          url:  req.url,
          data: req.data
        };
      } else {
        return null;
      }
    },
    refreshAreaPartial: function(options, onComplete){
      $.fluxx.log("**> refreshAreaPartial");
      var options = $.fluxx.util.options_with_callback({animate: true, data: ""}, options, onComplete);
      return this.each(function(){
        // if the current context has a data-src attribute, we assume it is a partial.
        // By doing this we really don't need to give a specific area the partial class when
        // targeting it using the "refreshNamed" action.
        var $partial = ($(this).attr('data-src') ? $(this) : $(this).fluxxCardPartial());
        if ($partial.hasClass('detail') && !$partial.hasClass('fluxx-admin-partial')) {
          $card = $partial.fluxxCard();
          var req = $card.fluxxCardDetail().fluxxCardAreaRequest();
          $card.fluxxCardLoadDetail(req);
        } else {
          if (options.animate) {
            $.ajax({
              url: $partial.attr('data-src'),
              data: options.data,
              beforeSend: function() {
                $partial.addClass('updating');
                if (!$partial.hasClass('modal') && !$partial.hasClass('fluxx-admin-partial'))
                  $partial.children().fadeTo(300, 0);
                else
                  $partial.find('.edit').addClass('updating').fadeTo(300, 0);
              },
              success: function(data, status, xhr){
                if ($partial.hasClass('modal')) {
                  $partial.find('.edit, .show').html($(data).find('.edit, .show').html());
                  $('.footer .workflow', $partial).html('');
                  $partial.removeClass('updating').areaDetailTransform();
                  $partial.find('.edit').removeClass('updating').fadeTo(300, 1).trigger('refresh.fluxx.area');

                } else {
                  var $data = $('<div/>').html(data);
                  if ($data.find('#card-header')[0]) {
                    $partial.find('.body').css({opacity: 1}).html($data.find('#card-body').html()).end().removeClass('updating').children().areaDetailTransform().fadeIn();
                  } else {
                    var $data = $(data);
                    $data =  $data.attr('data-src') == $partial.attr('data-src') ? $data.children() : $data;
                    $partial.html($data).removeClass('updating').children().areaDetailTransform().fadeIn();
                  }
                  $partial.children().css({opacity: 1});
                }
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
          if (obj && obj.name && obj.name == 'filter-text')
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
        scroll = $(window).scrollLeft(),
        cardLeft = $card.offset().left,
        cardWidth = $card.width() + $card.fluxxCardMargin();
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
      return this.fluxxCardArea().data('history') ? this.fluxxCardArea().data('history')[0].data : '';
    },
    fluxxCardListing: function() {
      return this.fluxxCard().data('listing') || $([]);
    },
    fluxxCardDetail: function () {
      return this.fluxxCard().data('detail');
    },
    fluxxCardUid: function () {
      return this.fluxxCard().data('uid');
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
      if ($flows.length == 0) {
        $('.footer', $area).append('<div class="workflow"/>');
        $flows = $('.footer .workflow', $area);
      }

      $forms.each(function(){
        var $form   = $(this),
            $submit = $(':submit:last', $form);
        /* XXX GENERATE FROM $.fluxx.card.ui.workflowButton() !!! */
        if (!$submit.hasClass('ignore') && !$form.hasClass('no-submit-button')) {
          $('<a>').attr('href', $form.attr('action')).text($submit.val()||'Submit').bind('click', function(e){
            $.fluxx.util.itEndsWithMe(e);
            // Prevent submitting the form multiple times
            if ($form.data('submitting'))
              return;
            $form.data('submitting', true);
            $form.submit();
          }).wrap('<li>').parent().appendTo($flows);
          $('.footer', $area).removeClass('empty');
        }
        $submit.hide();
      });

      if ($area.attr('data-has-drawer')) {
        var $tabs = $('.info .tabs', $area.fluxxCard()), $sections = $('.drawer .section', $area.fluxxCard());
        $tabs.html($sections.clone());
        $('.info', $area.fluxxCard()).removeClass('open');
      }

      //Datepicker does not like form elements that have the same ID

      var dateOptions = { changeMonth: true, changeYear: true, dateFormat: $.fluxx.config.date_format };
      $('.datetime input', $area).fluxxDatePicker(dateOptions);

      $.fluxx.util.autoGrowTextArea($('textarea', $area));
      $('.multiple-select-transfer select[multiple="true"], .multiple-select-transfer select[multiple="multiple"]', $area).selectTransfer();
      $('.delete-this', $area).after($('<a class="do-delete-this" href="#">-</a>'));
      $('.add-another', $area).after($('<a class="do-add-another" href="#">+</a>'));
      if ($('.visualizations', $area).length)
        $area.addClass('report-area');

      $('textarea.wysiwyg', $area).each(function() {
        var $elem = $(this);
        $elem.rte({
          content_css_url: '/stylesheets/fluxx_engine/lib/rte/css/rte.css',
          media_url: '/stylesheets/fluxx_engine/lib/rte/img/',
          buttons: $(this).data('wysiwyg-buttons').replace(/\s+/, '').split(','),
          height: $(this).data('height')
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
            var modelID = url.match(/\/(\d+)$/);
            if (modelID)
              modelID = modelID.pop();

            if (modelID && $select.length) {
              $select.change(function() {
                $select.unbind('change');
                $select.val(modelID)
              });
              // Refresh user dropdowns
              $('[data-related-child]', $area.fluxxCard()).each(function() {
                $input = $(this);
                _.each($input.attr('data-related-child').split(/,/), function($child) {
                  $child = $child.replace(/^\./, '');
                  if ($select.hasClass($child))
                    $input.change();
                });
              });
            }
          });
        }
        var $link = $(this);
        $($link.attr('data-trigger-field'), $area).change(function () {
          var $elem = $(this);
          if ($elem.val()) {
            // Put the organization ID into the link to create a new user
            // TODO This field name should not be hardcoded
            var org_id = parseInt($elem.val());
            if (org_id)
              $link.attr('href', $link.show().attr('href')
                .replace(/([\&\?])user\[temp_organization_id\]=[0-9]*/, "$1user[temp_organization_id]=" + org_id ));
          } else {
            // Hide "add new" links if no organization is selected
            $link.hide();
          }
        }).change();
      });

      $('.header .notice:not(.error)', $area).delay(2000).find('.close-parent').click();
      // Put notices in a more convient place in modals
      if ($area.hasClass('modal')) {
        $('.header .notice', $area).clone().prependTo($('.body', $area));
      }

      if ($('.partial[data-refresh-onload=1]', $area).length > 0)
        $('.partial[data-refresh-onload=1]', $area).refreshAreaPartial({
          animate: false
        });

      $('.horizontal-tabs', $area).each(function() {
        var $elem = $(this);
        $area.find('.edit, .show').addClass('withtabs');
        var cookieName = "fluxx_tabs_" + $elem.attr('name');
        var tab_cookie_id = parseInt($.cookie(cookieName)) || 0;
        var $card = $area.fluxxCard();
        $('ul:first li', $elem).each(function() {
          var $li = $(this);
          if (!$li.find('a span')[0]) {
//            Provide a span tag inside tabs so that a loading indicator can be displayed
            $li.find('a').html('<span>'+ $li.text() + '</span>')
          }
        });
        $elem.tabs({
          spinner: 'Loading...',
          selected: tab_cookie_id,
          select: function(e,ui) {
            $.cookie(cookieName, ui.index);
          },
          show: function(e, ui) {
            if ($(ui.tab).attr('href').match(/^#ui-tabs-\d+/)) {
              $($(ui.tab).attr('href'), $area).html('');
            }
          },
          load: function(e,ui) {
            $(this).areaDetailTransform();
            $.my.stage.resizeFluxxStage();
          }
        });
      });
      $('.sortable', $area).sortable().bind('sortupdate', function(e, ui) {
        var $elem = $(this);
        var $area = $elem.fluxxCardArea();
        $area.data('updated', true);
        if (!$area[0].hasOwnProperty('saveSortOrder')) {
          $area[0].saveSortOrder = function() {
            var $area = $(this);
            var callBack = arguments.length >= 1 ? arguments[0] : null;
            var order_list = [];
            $elem.find('li').each(function() {
              order_list.push($(this).attr('id'));
            });
            var $area = $elem.fluxxCardArea();

            var re = new RegExp('([?&])order_list=[^?&]*');
            $area.attr('data-src', $area.attr('data-src').replace(re, '') + "&order_list=" + order_list);
            $area.children().fadeTo('fast', 0.33);
            $area.refreshAreaPartial({}, function() {
              if (callBack)
                callBack();
              $area.children().fadeTo('fast', 1);
            });
          };
        }
      });
		  $('.sortable', $area).disableSelection();
      if ($('#fluxx-admin').length) {
        // Enable and disable admin save buttons
        // We only use these buttons when the admin section we are working in is a form that may need to be saved.
        var $adminForm = $('#fluxx-admin form').not('.modal form'),
            $buttons = $('#fluxx-admin #admin-buttons li a');
        $buttons.addClass('disabled');
        $adminForm.unbind('change').change(function() {
          if (!$('#fluxx-admin .form-builder:visible')[0])
            $buttons.removeClass('disabled')
        }).unbind('keydown').keydown(function() {
          if (!$('#fluxx-admin .form-builder:visible')[0])
            $buttons.removeClass('disabled')
        });

        $('.admin-submit').unbind('click').click(function(e) {
          $.fluxx.util.itEndsWithMe(e);
          if (!$(this).hasClass('disabled')) {
            $('#fluxx-admin .edit').fadeTo(300, .3);
            $adminForm.submit();
          }
        });
        // Disable component interaction in form builder mode
        $('.form-builder').find('a, img').click(function(e) {
          var $elem = $(this);
          if (!$elem.hasClass('edit-form-element')) {
            $.fluxx.util.itEndsWithMe(e);
          }
        });
      }
      $area.carousel();
      $area.serializeToField();
      $('.upload-file').each(function() {
        if (!$.fluxx.config.uploader_unique_id)
          $.fluxx.config.uploader_unique_id = 0;
        var unique = $.fluxx.config.uploader_unique_id++;
        var $elem = $(this);
        $elem.attr('id', 'pickfiles_' + unique);
        var uploader = new plupload.Uploader({
            runtimes : 'html5',
            multipart: false,
            browse_button : $elem.attr('id'),
            max_file_size : '10mb',
            url: $elem.attr('href'),
            filters: [{title: "Allowed file types", extensions: $elem.attr('data-extensions')}]
        });
        uploader.init();
        uploader.bind('FilesAdded', function(up, files) {
          $area.addClass('updating');
          $area.fadeTo(300, .4);
          uploader.start();
        });
        uploader.bind('Error', function(up, err) {
          $area.fadeTo(300, 1, function() {
            var message = $elem.attr('data-error-message') ? $elem.attr('data-error-message') : err.message + (err.file ? ", File: " + err.file.name : "")
            alert(message);
            up.refresh(); // Reposition Flash/Silverlight
          });
        });
        uploader.bind('FileUploaded', function(up, file) {
          $area.fadeTo(300, 1);
          var actions = $elem.attr('data-on-success');
          if (actions) {
            $area.runLoadingActions();
          } else if ($elem.parents('.partial').length) {
            $elem.refreshAreaPartial();
          } else {
            $elem.refreshCardArea();
          }
        });
      });
      $('[data-char-limit]', $area).each(function() {
        var $input = $(this),
            limit = parseInt($input.data('char-limit'));
        $input.charCount({
          allowed: limit,
          counterText: 'Characters left: '
        });
      });
      return this;
    },
    fluxxDatePicker: function(options) {
      if (!$.fluxx.config.datepicker_unique_id)
        $.fluxx.config.datepicker_unique_id = 0;
      return this.each(function() {
        if ($(this).attr("data-year-range"))
          options.yearRange = $(this).attr("data-year-range");

        var unique = $.fluxx.config.datepicker_unique_id++;
        var $input = $(this);
        var id = $input.attr('id');
        if (!id)
          $input.attr('id', 'input_' + unique);
        else if (id.match(/[a-zA-Z]/))
          $input.attr('id', $input.attr('id') + '_' + unique);
        $input.datepicker(options);
      });
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
          init: function (e) {
            $filters.appendTo($card.fluxxCardBody());
          }
        }, function () {
          $('.date input', $filters).fluxxDatePicker({ changeMonth: true, changeYear: true, dateFormat: $.fluxx.config.date_format });
          // Construct the human readable filter text
          var $form = $('form', $filters).submit(
            function() {
              $('input,select', $form).removeAttr("disabled");
              $card.rollupHierarchy($form);
              var criterion = [];
              $filterText.val('');
              $card.data('locked', $('#lock-card').attr('checked') == 'checked');
              $filters.find(':input').each(function(index, elem) {
                var $elem = $(elem);
                var id = $elem.attr('id');
                var val = $elem.val();
                if (val) {
                  var label = $('[for*="' + id + '"]', $filters).text();
                  label = label.replace(/:$/, '');
                  var type = $elem.attr('type');
                  if (type == 'checkbox') {
                    if ($elem.attr('checked') == true)
                      criterion.push(label);
                  } else if (type == 'select-one' || !type) {
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
            '>Lock Card</label></li>').prependTo($form);
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
          var data = $listing.fluxxCardAreaRequest().data;
          if (openInDetail || typeof data == "string") {
            $form.removeClass('to-listing').addClass('to-detail');
            if ($listing.fluxxCardAreaData() != '' && typeof $listing.fluxxCardAreaData() != "object") {
              var filter = typeof data == "object" ? data : $.fluxx.unparam(data);
              data = [];
              _.each(filter, function(val, key) {
                if ($.isArray($.fluxx.unparam($listing.fluxxCardAreaData()))) {
                  _.each(val, function(singleValue) {
                    data.push({name: key, value: singleValue});
                  });
                } else {
                  data.push({name: key, value: val});
                }
              });
            }
          }
          $filters.populateFilterForm(data);
        });
      });
    },
    closeListingFilters: function() {
      return this.each(function(){
        var $card = $(this).fluxxCard();
        $('.filters', $card).remove();
        $('.actions', $card).click();
      });
    },
    populateFilterForm: function(data) {
      if (!data)
        return;
      var $filters = $(this);
      var found = {};
      _.each(data, function(obj, val) {
        if (obj && obj.value) {
          var $rollup = $('[data-rollup="' + obj.name.replace(/\w+\[(\w+)\]\[\]/, "$1") + '"]');
          var i = 0;
          if ($rollup.length > 0) {
            var $addNew = $rollup.find('.do-add-another:first');
            _.each(obj.value.split(','), function(item) {
              if (i++ > 0)
                $addNew.click();
              var $section = $('[data-rollup="' + $rollup.attr('data-rollup') + '"]:last', $filters.fluxxCard());
              $addNew = $section.find('.do-add-another:first');
              var vals = item.split('-');

              var setVal = function(e) {
                var $el = $(this);
                $el.val(e.data).change();
              };

              for ( var j=0, len=vals.length; j<len; ++j ) {
                if (vals[j]) {
                  var $sel = $section.find('select:eq(' + j + ')');
                  if (j == 0) {
                    $sel.val(vals[0]).change();
                  } else {
                    $sel.bind('options_updated', vals[j], setVal);
                  }
                }
              }
            });
          } else {
            var selector = '[name="' + obj.name.replace(/\[\]$/,'') + '"]:last';
            var $elem = $(selector, $filters);
            if (!$elem[0])
              $elem = $('[name="' + obj.name + '"]:last', $filters);
            if (!$elem.parent().parent().data('rollup')) {
              if (found.hasOwnProperty(obj.name) && obj.value && found[obj.name].indexOf(obj.value) == -1) {
                var $add  = $elem.clone();
                $elem.after($add);
                $add.before($('<label/>'));
                $elem = $add;
              }
              $elem.val(obj.value).change();
              if ($elem.val() != obj.value) {
                $elem.one("change", function() {
                  $elem.val(obj.value).change();
                });
              }

              $(selector + ":checkbox", $filters)
                .attr('checked', true)
                .change(function () {
                  $(selector + ":hidden", $filters).val(this.checked ? this.value : "");
                });
              if ($elem.hasClass('add-another') && obj.value) {
                if(!found[obj.name])
                  found[obj.name] = [];
                found[obj.name].push(obj.value)
              }
            }
          }
        }
      });
    },
    rollupHierarchy: function ($form) {
      $card = $(this);
      var extra = {};
      var rollup_field;
      $('.hierarchical-filter', $form).each(function() {
        var $section = $(this);
        var rollup = [];
        if (extra[$section.attr('data-rollup')])
          rollup = extra[$section.attr('data-rollup')];
        else
          extra[$section.attr('data-rollup')] = rollup;
        $section.find('select:first').each(function() {
          $select = $(this);
          if (!rollup_field)
            rollup_field = $select.attr('name').replace(/\[.*/, '');
          var program_filters = [['','','','']];
          for (i=0;i<=3;i++) {
            var j = 0;
            $('#' + $select.attr('id'), $card).each(function() {
              var $sel = $(this);
              if (!program_filters[j]) {
                program_filters.push(program_filters[j-1].slice(0));
              }
              program_filters[j][i] = $sel.val();
              j++;
            });
            $select = $select.parent().parent().children().find('select:first').not($select);
          }
          _.each(program_filters, function(item) {
            var values = item.join('-');
            if (!values.match(/^\-/) && rollup.indexOf(values) == -1)
              rollup.push(values);
          });
        });
      }).find('select').attr('disabled', true);
      for (var rollup in extra) {
        $('<input type="hidden" name="' + rollup_field + '[hierarchies][]" value="' + rollup + '"/>').appendTo($form);
        $('<input type="hidden" name="' + rollup_field + '[' + rollup + '][]" value="' + extra[rollup] + '"/>').appendTo($form);
      }
    },
    serializeToField: function() {
      $area = $(this);
      $('[data-serialize-to-field]', $area).each(function() {
        var $form = $('form', $area);
        var $section = $(this);
        var $field = $($section.attr('data-serialize-to-field'), $area);
        $section.populateFilterForm($.parseJSON($field.val()));
        $form.submit(function() {
          $area.rollupHierarchy($section);
          var o = [];
          $.each($section.find(':input'), function() {
            var $elem = $(this);
            if ($elem.hasClass('add-another'))
              this.name = $elem.attr('name') + '[]';
            if (this.name != 'authenticity_token' && this.name != 'utf8' && ($elem.attr('type') != 'checkbox' || $elem.attr('checked'))) {
              o.push({name: this.name, value: $elem.val()});
            }
          });
          $section.find(':input').remove();
          $field.val($.toJSON(o));
        });
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
            type: ['modal', 'new-modal'],
            arrow: 'left',
            closeButton: true
          }
      )).data({url: options.url, target: options.target});
      if (options.wide)
        $modal.addClass('wide');
      $card.fluxxCardLoadContent({
        area: $modal,
        url: options.url,
        header: '<span>' + options.header + '</span>',
        caller: options.target,
        init: function(e) {
          $card.showLoadingIndicator();
          $modal.appendTo($card).css('opacity', '0');
          $modal.data({cardX: options.event.pageX - $card.offset().left,
                       cardY: options.event.pageY - $card.offset().top,
                       pageX: options.event.pageX,
                       pageY: options.event.pageY});

          var originalScroll = $('.area', $card).not('.modal').scrollTop();
          $('.area', $card).not('.modal').disableFluxxArea();
          $modal.bind('refresh.fluxx.area', function (e, $target, url) {
            $modal = $(this);
            var $title = $('.header span', $modal);
            if ($title.text().length > 25)
              $title.text($title.text().slice(0, 30) + '...');

            if (!$card[0])
              $card = $('#fluxx-admin') || $modal.fluxxCard();
            var $arrow = $('.modal-arrow', $modal);
            var contentHeight = 0;
            $('.body', $modal).children().each(function () {
              contentHeight += $(this).height();
            });
            var headerHeight = $('.header', $modal).outerHeight(true);
            var borderHeight = parseInt($modal.css('borderTopWidth')) + parseInt($modal.css('borderBottomWidth'));
            var $footer = $('.footer', $modal);
            if (!$footer.data('hide') && $footer.find('.workflow').children()[0])
              $footer.show();
            else if (!$('a.show-footer', $card)[0])
              $footer.remove().hide();
            var footerHeight = $footer.is(":visible") ? $('.footer', $modal).outerHeight(true) : 0;
            var maxHeight = $card.height() - (borderHeight + headerHeight + footerHeight);
            var modalHeight = (contentHeight > maxHeight ? maxHeight : contentHeight) + borderHeight + headerHeight + footerHeight + 41;
            $modal.height(modalHeight);
            $('.body', $modal).height(modalHeight - headerHeight - footerHeight - borderHeight);

            var modalTop = $modal.data('cardY') - (modalHeight * .2) - $arrow.outerWidth(true) - 7;
            var modalLeft = 0

            leftArrow = $modal.data('cardX') <= $card.width() / 2;
            if (leftArrow) {
              modalLeft = $modal.data('cardX') + 20;
            } else {
              modalLeft = $modal.data('cardX') - $modal.outerWidth(true) - 20;
              if (modalLeft < 0) {
                leftArrow = true;
                var oldLeft = modalLeft;
                modalLeft = $modal.data('cardX') + 20;
//                Special case for admin modals since the stage cannot scroll
                if ($card.attr('id') == 'fluxx-admin-card' &&  (modalLeft + $modal.outerWidth(true) + 120) > $(window).width()) {
                  leftArrow = false;
                  modalLeft = oldLeft;
                }
              }
            }
            if (!leftArrow) {
              $arrow.addClass('right');
              $arrow.removeClass('left');
              if (options.wide)
                $arrow.css({marginLeft: 280});
            }

            var cardHeight = $card.height();
            var modalBottom = modalTop + $modal.height();
            if (modalBottom > cardHeight)
              modalTop = (cardHeight + 20) - modalHeight;
            else if (modalTop < -20)
              modalTop = -20
            $modal.css({left: modalLeft, top: modalTop});

            $arrow.offset({top: $modal.data('pageY') - 18});
          });
          if (options.hideFooter)
            $modal.find('.footer').hide().data('hide', true);
          }
        },
        function(e) {
          $card.hideLoadingIndicator();
          if (onComplete)
            onComplete.call();
          $modal.trigger('refresh.fluxx.area').fadeTo('slow', 1);
        }, true);
      });
    },
    closeCardModal: function(options) {
      var options = $.fluxx.util.options_with_callback({url: null, header: 'Modal', target: null},options);
      return this.each(function(){
        var $modal = $('.modal', $(this).fluxxCard());
        if ($modal.length > 0) {
          if ($modal.data('target') && $modal.data('target').attr('data-on-close') && $modal.data('updated')) {
            var onClose = $modal.data('target').attr('data-on-close');
            var target =  $modal.data('target');
            var onCloseFunc = function () {
              _.each(onClose.replace(/\s/g, '').split(/,/), function(action){
                var func = $.fluxx.card.loadingActions[action] || $.noop;
                $modal.data('target', target);
                (_.bind(func, $modal))();
              });
              $modal.fadeOut(function() {
                var $card = $modal.fluxxCard();
                $('.area', $card).not('.modal').enableFluxxArea().first().trigger('close.fluxx.modal', [$modal.data('target'), $modal.data('url')]);
                $modal.remove();
              });
            }
            if ($modal[0] && $modal[0].hasOwnProperty('saveSortOrder') && $modal[0].saveSortOrder) {
              $modal[0].saveSortOrder(onCloseFunc);
            } else {
              onCloseFunc();
            }
          } else {
            $modal.fadeOut(function() {
              var $card = $modal.fluxxCard();
              $('.area', $card).not('.modal').enableFluxxArea().first().trigger('close.fluxx.modal', [$modal.data('target'), $modal.data('url')]);
              $modal.remove();
            });
          }
        }
      });
    },
    disableFluxxArea: function () {
      return this.each(function(){
        var $area = $(this).fluxxCardArea();
        $area.data('position', $area.css('position')).data('z-index', $area.css('z-index'));
        $area.addClass('disabled')
          .bind('click', function(e) {
            $.fluxx.util.itEndsWithMe(e);
          });
        if ($area.hasClass('fluxx-admin-partial'))
          $area.css({postion: 'relative', 'z-index': -1})
      });
    },
    enableFluxxArea: function () {
      return this.each(function(){
        var $area = $(this).fluxxCardArea();
        $area.removeClass('disabled').css({overflow: 'auto'})
          .unbind('click')
          .css({postion: $area.data('position'), 'z-index': $area.data('z-index')});
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
      var $card = $area.fluxxCard();
      if ($card.isSpreadsheetCard() || $card.isSummaryCard()) {
        $area.refreshCardArea();
        $('.updates', $card).hide();
        $card.removeClass('updates-available');
      } else {
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
                function(id) {$removals = $removals.add($('.entry[data-model-id="'+id+'"]', $area))}
              );
              $removals.remove();
              $entries.addClass('latest').prependTo($('.list', $area));
              $area.data('updates_seen', []);
              delete _.last($('.listing:first', $area.fluxxCard()).data('history')).data.id;
              $area.fluxxCard().trigger('update.fluxx.card', [-1 * $entries.length, 'getFluxxListingUpdate'])
            }
          }
        );
      }

      $.ajax(req);
    },

    /* Data Loaders */
    fluxxCardLoadContent: function (options, onComplete, modal) {
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

          return $area.runLoadingActions();

        }
      };
      options = $.fluxx.util.options_with_callback(defaults,options,onComplete);
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
            // Allow detail area's width to be overriden
            var detailWidth = parseInt(options.area.attr('data-detail-width'));
            if (detailWidth > 0 && options.area.hasClass('detail')) {
              $area.width(detailWidth);
            }
            // Render in card spreadsheet view with fixed column and row labels
            $('table.spreadsheet', options.area).each(function() {
              var $table = $(this)
              var fitsCard = $table.width() < 1000;
              if (fitsCard)
                $table.width(options.area.fluxxCard().width() - 5);
              $rowLabels = $table.clone();
              $rowLabels.find('th').remove();
              var headerHeight = $('td:first', $table).outerHeight() + 1;
              var rowLabelWidth = $table.find('th:first').outerWidth();
              var cardHeaderHeight = $('.header', options.area).height() + 5;
              var $header = $('<div class="spreadsheet-header"/>').width(100000);
              $table.css({"margin-top": "-" + (headerHeight - 3) + "px", "margin-left": "-" + rowLabelWidth + "px"});
              $table.find('th').each(function() {
                var $th = $(this).css({"white-space": "nowrap"});
                $header.append($('<div>' + $th.text() + '</div>').width($th.outerWidth()));
              });
              var fullscreen = $('body').hasClass('fullscreen-view');
              var offset = fullscreen ? 28 : 1;
              $table.wrap(
                $('<div class="table-scroller"></div>').width(options.area.width() - rowLabelWidth - offset).height($('.body', options.area).height() - headerHeight + 2
              ).css({overflow: "auto", "background-color": "#fff"}));
              $table.parent().before($header);
              $header.wrap($('<div class="header-scroller"></div>').css({overflow: "hidden"}).width(options.area.width()));
              var $headerScroll = $header.parent();
              $headerScroll.css({position: "relative", left: rowLabelWidth + "px"});
              $firstHeader = $header.find('div:first').detach().addClass('row-labels');
              options.area.find('.spreadsheet-view').append($firstHeader);
              $firstHeader.wrap('<div class="spreadsheet-header first-header"/>');
              $firstHeader.parent().css({position: "absolute", top: cardHeaderHeight - 1 + "px", left: "0xp"});
              var $tableScroll = $table.parent();
              $tableScroll.css({position: "absolute", top: headerHeight + cardHeaderHeight - 3 + "px", left: rowLabelWidth + "px"});
              $rowLabels.width(rowLabelWidth + (fitsCard ? 10000: 0));
              $rowLabels.css({"margin-bottom": "100px", "margin-top": "5px"});
              $table.parent().before($rowLabels);
              $rowLabels.wrap($('<div class="row-scroller"></div>').css({overflow: "hidden", "background-color": "#fff"}).height($('.body', options.area).height() + 5000).width(rowLabelWidth));
              var $rowScroll = $rowLabels.parent();
              $tableScroll.scroll(function () {
                $headerScroll.scrollLeft($tableScroll.scrollLeft());
                $rowScroll.scrollTop($tableScroll.scrollTop());
              });
            });
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

      var complete = function (data) {
        // Don't try and render an entire document, forcing the page to be overwritten
        if (data.search("<html>") != -1)
          return;
        var $document = $('<div/>').html(data);
        var header = ($('#card-header', $document).html() && $('#card-header', $document).html().length > 1 ?
          $('#card-header', $document).html() + options.header : options.header);
        var $title = $('.header span', options.area);

        var $header = $('.header', options.area).html($.trim(header));
        if ($('span', $header).length == 0)
          $header.prepend($title);

        $('.body',   options.area).html($.trim($('#card-body',   $document).html() || options.body)).scrollTop(0);
        $('.footer', options.area).html($.trim($('#card-footer', $document).html() || options.footer));
        if (!modal) $('.drawer', options.area.fluxxCard()).html($.trim($('#card-drawer', $document).html() || ''));
        $('.header,.body,.footer', options.area).removeClass('empty').filter(':empty').addClass('empty');
        if (options.area.attr('data-has-drawer')) {
          if ($('.drawer', options.area.fluxxCard()).filter(':empty').length) {
            $('.drawer', options.area.fluxxCard()).parent().addClass('empty');
          } else {
            $('.info', options.area.fluxxCard()).removeClass('open-wide');
            $('.drawer', options.area.fluxxCard()).parent().removeClass('empty');
          }
        }
        options.area
          .fluxxAreaSettings({settings: $('#card-settings', $document)})
          .trigger('complete.fluxx.area').trigger('lifetimeComplete.fluxx.area');
        options.area.fluxxCard().css('overflow', 'visible').trigger('lifetimeComplete.fluxx.card');
      };
      if (options.area.data('request'))
        options.area.data('request').abort();
      options.area.data('request', $.ajax({
        url: options.url,
        type: options.type,
        data: data,
        success: function (data, status, xhr) {
          if (xhr.status == 201) {
            options.area.fluxxCard().hideLoadingIndicator();
            // Store the redirect URL for cases where we need to figure out what was created or updated
            options.area.data({'url': xhr.getResponseHeader('Location'), request: null});

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
            var $card = options.area.fluxxCard();
            if (options.area.fluxxCardAreaRequest())
              options.area.attr('data-src', options.area.fluxxCardAreaRequest().url);
            if (($card.attr('id') != 'fluxx-admin-card') && !options.area.is(':visible') && options.area.width() > 0) {
              $card.animateWidthTo($card.width() + options.area.width(), function() {
                // Wait a bit before displaying content to avoid an animation jump
                setTimeout(function () {
                  options.area.fadeIn(1000);
                  complete(data);
                }, 50);
                if ($card.is(':visible') && !$card.cardVisibleRight())
                  $card.focusFluxxCard({scrollEdge: 'right'});
              // Animate the card width an additional 12 pixels to account for connected data tabs.
              // This helps prevent a jump when the tabs are displayed
              }, null, (options.area.attr('data-has-drawer') ? 12 : 0));
            } else {
              if ($card.is(':visible') && !$card.cardVisibleRight())
                $card.focusFluxxCard({scrollEdge: 'right'});
              complete(data);
            }
          }
        },
        error: function(xhr, status, error) {
          if (status == 'abort')
            return;
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
      }));


      return this;
    },
    runLoadingActions: function($target) {
      var $area = $(this);
      if (!$target)
        $target = $area.data('target');
      var onSuccess = $target.attr('data-on-success'),
          closeCard = false;
      // If we have onSuccess actions, execute them
      if (onSuccess) {
        _.each(onSuccess.replace(/\s/g, '').split(/,/), function(action){
          var func = $.fluxx.card.loadingActions[action] || $.noop;
          // Return a flag if we have closed this card so that continued loading stops
          if (action == 'close')
            closeCard = true;
          (_.bind(func, $area, $target))();
        });
      }
      return closeCard;
    },
		showLoadingIndicator: function() {
      var $loading = $(this).hasClass('admin-card') ? $('#fluxx-admin .fluxx-admin-partial') : $('.loading-indicator', $(this));
      $loading.addClass('loading').data('loading-count', Number($loading.data('loading-count') || 0) + 1);
		},
		hideLoadingIndicator: function() {
      var $loading = $(this).hasClass('admin-card') ? $('#fluxx-admin .fluxx-admin-partial') : $('.loading-indicator', $(this));
      if($loading.data('loading-count') > 1) {
        $loading.data('loading-count', Number($loading.data('loading-count')) - 1);
      } else {
			  $loading.removeClass('loading').data('loading-count', 0);
      }
		},	
    fluxxCardLoadListing: function (options, onComplete) {
      $.fluxx.log("**> fluxxCardLoadListing");
      var options = $.fluxx.util.options_with_callback({area: this.fluxxCardListing()},options,onComplete);
      return this.fluxxCardLoadContent(options, onComplete);
    },

    fluxxCardLoadDetail: function(options, onComplete) {
      $.fluxx.log("**> fluxxCardLoadDetail");
      var options = $.fluxx.util.options_with_callback({area: this.fluxxCardDetail()},options,onComplete);
      return this.fluxxCardLoadContent(options);
    },
    serializeForm: function() {
      var $form = $(this);
      var data = $form.serializeArray();
      // Send blank values for select transfers so that values can be blanked
      $form.find('.include-blank').each(function() {
        if (!$(this).val())
          data.push({name: this.name, value: ""});
      });

      var found= {};
      var out = [];
      $.each(data, function(i, obj) {
        if (obj.name.match(/\[\]$/)) {
          out.push(obj);
        } else {
          if (!found[obj.name] || obj.value)
            found[obj.name] = obj.value;
        }
      });
      $.each(found,function(name, value) {
        out.push({name: name, value: value});
      });
      return out;
    },
    isSpreadsheetCard: function() {
      return $('.body .spreadsheet-view', $(this))[0] != null
    },
    isSummaryCard: function() {
      return $('.body .summary-view', $(this))[0] != null
    },
    changeView: function(view) {
      var $elem = $(this);
      var $card = $elem.fluxxCard();
      if ($elem.hasClass('disabled'))
        return;
      $('.open-listing-actions', $elem.fluxxCard()).click();
      var req = $card.fluxxCardListing().fluxxCardAreaRequest();
      if (!$.isArray(req.data))
        req.data = []
      var data = _.select(req.data, function(item) {
        return (item && item.name != 'spreadsheet' && item.name != 'summary')
      });
      data.push({name: view, value: "1"});
      req.data = data;
      var $detail = $card.fluxxCardDetail();
      $card.data('lastDetailOpen', ($detail && $detail.fluxxCardAreaRequest()));
      $elem.closeDetail();
      $elem.fluxxCardLoadListing(req,
        function() {
          if (view == "spreadsheet") {
            $card.fluxxCardListing().width(998);
            $card.addClass(view + '-card');
            $card.removeClass('summary-card');
            $card.animateWidthTo(1000, function() {
              $card.focusFluxxCard({scrollEdge: 'right'});
            });
          } else {
            $card.addClass(view + '-card');
            if ($card.width() > 338) {
              $card.animateWidthTo(338, function() {
                $card.fluxxCardListing().width(336);
                $card.removeClass('spreadsheet-card');
              });
            }
          }
      });
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
      $box.width($box.width() + 10).animate({width: widthTo}, speed, function() {
        $('.title', $card).show();
        $('#card-table').width('100%')
        $card.height($card.height() - 20);
        $.my.stage.animating = false;
        $.my.stage.resizeFluxxStage();
        if (callback)
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
                    cw = _.addUp($('.area[minimized="true"]', $card), 'outerWidth', true);
                  $card.fluxxCardMinimized().fadeOut('fast', function() {
                    $card.animateWidthTo(cw, function() {
                      $titlebar.attr('minimized', 'false');
                      $('.maximize-card', $card).removeClass('maximize-card').addClass('minimize-card');
                      $('.title', $card).show();
                      $card.fluxxCardMinimized().hide();
                      $('.footer', $card).css('opacity', 1);
                      $('.area, .info', $card).filter('[minimized="true"]').fadeIn('slow').attr('minimized', 'false');;
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
          refreshCaller: function($target){
            // Refresh the card area this modal was called from
            if (!$target)
              $target = this.data('target');
            if (!$target) return;
            $.fluxx.log("Refreshing caller after modal close");
            var $this = this,
                $area = $target.fluxxCardArea(),
                // resetTarget will use the target elements href attribute to located
                // the new element after a refresh. This is needed because the original
                // element is removed from the DOM as new HTML as added after the ajax call.
                resetTarget = function() {
                  var href = $target.attr('href'),
                      newTarget = $('[href="' + href + '"]', $area);
                  if (newTarget[0])
                    $this.data('target', newTarget);
                  if ($area.hasClass('fluxx-admin-partial'))
                    $area.removeClass('updating').children().fadeTo(300, 1);

                };
            if ($target.parents('.partial').length && $target.parents('.partial').attr('data-src')) {
              $.fluxx.log("Refreshing PARTIAL");
              $target.refreshAreaPartial({}, resetTarget);
            } else {
              $.fluxx.log("Refreshing AREA");
              var $area = $target.fluxxCardArea();
              if ($area.hasClass('fluxx-admin-partial')) {
                $area
                 .addClass('updating')
                 .children()
                 .fadeTo(300, 0);
              }
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
          refreshModal: function($target){
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
                $card = $elem.fluxxCard();

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
            if (!lookupURL) {
              var $partial = $($elem.attr('data-target'), $card);
              if ($partial.length) {
                var objectID = this.data('url').match(/\/(\d+)$/);
                if (objectID) {
                  objectID = objectID.pop();
                  var re = new RegExp('\/([A-Za-z0-9\-]+)\/edit');
                  $partial.attr('data-src', $partial.attr('data-src').replace(re, '/' + objectID + '/edit')).refreshAreaPartial();
                }
              }
            } else if (this.data('target').attr('target') && lookupURL) {
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
                      $child.val($child.children().first().val()).trigger('options_updated').change();
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
        '<a href="#" class="edit-report-filter" title="Edit Filter">',
        '<img alt="Edit Filter" src="/images/fluxx_engine/theme/default/icons/cog_edit.png">',
        '</a>',
        '<a href="#" class="refresh-card" title="Refresh Card">',
        '<img alt="Refresh Card" src="/images/fluxx_engine/theme/default/icons/arrow_refresh.png">',
        '</a>',
        '<a href="#" class="new-model new-detail" title="Create" data-insert="after">',
        '<img alt="Create" src="/images/fluxx_engine/theme/default/icons/add.png">',
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
        (options.arrow ? ['<div class="modal-arrow ', options.arrow, '"></div>'] : null),
        '<div class="header"></div>',
        '<div class="body"></div>',
        '<div class="footer"></div>',
      '</div>'
    ];
  };

})(jQuery);
