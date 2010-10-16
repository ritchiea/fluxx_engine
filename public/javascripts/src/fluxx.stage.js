(function($){
  $.fn.extend({
    fluxxStage: function(options, onComplete) {
      var options = $.fluxx.util.options_with_callback({}, options, onComplete);
      return this.each(function(){
        $.my.fluxx  = $(this).attr('id', 'fluxx');
        $.my.stage  = $.fluxx.stage.ui.call(this, options).appendTo($.my.fluxx.empty());
        $.my.hand   = $('#hand');
        $.my.header = $('#header');
        $.my.footer = $('#footer');
        $.my.stage.bind({
          'complete.fluxx.stage': _.callAll(
            _.bind($.fn.setupFluxxPolling, $.my.stage),
            _.bind($.fn.installFluxxDecorators, $.my.stage),
            _.bind($.fn.addFluxxCards, $.my.hand, {cards: $.fluxx.config.cards}),
            //$.fancybox.init,
            options.callback
          )
        });
        $(window).resize(function(e){
          $.my.cards.resizeFluxxCard();
        }).resize();
        $.my.stage.trigger('complete.fluxx.stage');
      });
    },
    removeFluxxStage: function(onComplete) {
      var options = $.fluxx.util.options_with_callback({}, onComplete);
      return this.each(function(){
        if (!$.my.stage) return;
        $(this).remove();
        $.my.stage.trigger('unload.fluxx.stage');
        $.my.stage = undefined;
        $.my.hand  = undefined;
        $.my.cards = $('.card');
        options.callback.call(this);
      });
    },
    resizeFluxxStage: function(options, onComplete) {
      if (!this.length) return this;
      var options = $.fluxx.util.options_with_callback({}, options, onComplete);
      var allCards = _.addUp($.my.cards, 'outerWidth', true);
      $.my.stage
        .width(allCards)
        .bind('resize.fluxx.stage', options.callback)
        .trigger('resize.fluxx.stage');
      return this;
    },    
    addFluxxCards: function(options, callback) {
      var options = $.fluxx.util.options_with_callback({}, options, callback);
      if (!options.cards.length) {
        options.callback();
        return this;
      }
      $.each(options.cards, function(i, v) {
        $.my.hand.addFluxxCard(this, function(){
          if (i == options.cards.length - 1) {
            options.callback();
          }
        }, true);
      });
      return this;
    },
    
    serializeFluxxCards: function () {
      return _.map($.my.cards, function(i){return $(i).serializeFluxxCard()});
    },
    
    installFluxxDecorators: function() {
      _.each($.fluxx.stage.decorators, function(val,key) {
        $(key).live.apply($(key), val);
      });
    },
    
    setupFluxxPolling: function () {
      if (! $.fluxx.config.realtime_updates.enabled) return;
      $.fluxx.realtime_updates = $.fluxxPoller($.fluxx.config.realtime_updates.options);
      $.fluxx.realtime_updates.start();
    }
  });
  
  $.extend(true, {
    fluxx: {
      config: {
        header: {
          actions: []
        }
      },
      stage: {
        attrs: {
          id: 'stage'
        },
        ui: function(options) {
          return $('<div>')
            .attr($.fluxx.stage.attrs)
            .html($.fluxx.util.resultOf([
              $.fluxx.stage.ui.header(options),
              $.fluxx.stage.ui.cardTable,
              $.fluxx.stage.ui.footer
            ]));
        },
        decorators: {
          'a.with-note': [
            'click', function(e) {
              var $elem = $(this);
              if ($elem.data('has_note')) {
              } else {
                $.fluxx.util.itEndsHere(e);
                $.prompt({
                  title: 'Note for ' + $elem.text(),
                  onOK: function(alert) {
                    var query = {};
                    query[$elem.attr('data-note-param') || 'note'] = alert.text;
                    var note = $.param(query);
                    var href = $elem.attr('href');
                    if (href.match(/\?/)) {
                      href += '&' + note;
                    } else {
                      href += '?' + note;
                    }
                    $elem.attr('href', href);
                    $elem.data('has_note', true);
                    $elem.click();
                  }
                });
                return false;
              }
            }
          ],
          'a.new-detail': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              var card = {
                detail: {url: $elem.attr('href')},
                title: ($elem.attr('title') || $elem.text())
              };
              if ($elem.attr('data-insert') == 'after') {
                card.position = function($card) {$card.insertAfter($elem.fluxxCard())};
              } else if ($elem.attr('data-insert') == 'before') {
                card.position = function($card) {$card.insertBefore($elem.fluxxCard())};
              }
              $.my.hand.addFluxxCard(card);
            }
          ],
          'a.close-detail': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              $elem.closeDetail();
            }
          ],
          'a.new-listing': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              var card = {
                listing: {url: $elem.attr('href')},
                title: ($elem.attr('title') || $elem.text())
              };
              if ($elem.attr('data-insert') == 'after') {
                card.position = function($card) {$card.insertAfter($elem.fluxxCard())};
              } else if ($elem.attr('data-insert') == 'before') {
                card.position = function($card) {$card.insertBefore($elem.fluxxCard())};
              }
              $.my.hand.addFluxxCard(card);
            }
          ],
          'a.noop': [
            'click', $.fluxx.util.itEndsHere
          ],
          'a.as-put': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              $elem.fluxxCardLoadContent({
                area: $elem.fluxxCardArea(),
                url: $elem.attr('href'),
                type: 'PUT'
              });
            }
          ],
          'a.as-post': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              if ($elem.attr('data-on-success') == 'refreshCaller') {
                $.ajax({
                  url: $elem.attr('href'),
                  type: 'POST',
                  complete: function (){
                    $elem.refreshCardArea();
                  }
                });
              } else {
                $elem.fluxxCardLoadContent({
                  area: $elem.fluxxCardArea(),
                  url: $elem.attr('href'),
                  type: 'POST'
                });
              }
            }
          ],
          'a.as-delete': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              if ($elem.attr('data-on-success') == 'refreshCaller') {
                $.ajax({
                  url: $elem.attr('href'),
                  type: 'DELETE',
                  complete: function (){
                    $elem.refreshCardArea();
                  }
                });
              } else {
                $elem.fluxxCardLoadContent({
                  area: $elem.fluxxCardArea(),
                  url: $elem.attr('href'),
                  type: 'DELETE'
                });
              }
            }
          ],
          'a.refresh-card': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              $(this).fluxxCardAreas().refreshCardArea();
            }
          ],
          'a.clone-template': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this),
                template = _.template($elem.attr('data-template').replace(/'/g, '"'),{record_index: _.uniqueId()}),
                $target = $($elem.attr('data-append-to'), $elem.fluxxCardArea());
              $(template).appendTo($target).areaDetailTransform();
            }
          ],
          'a.delete-parent': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this),
                $parent = $elem.parents($elem.attr('data-parent')).first();
              if (!$parent.length) return;
              
              // Take the element that contains the hidden destroy element and prepend it to the parent and set the value to 1
              var deleteFlagElement = $($elem.attr('data-hidden-destroy'), $parent);
              if(deleteFlagElement != null) {
                var clonedDeleteFlagElement = deleteFlagElement.clone();
                $parent.parents().first().prepend(clonedDeleteFlagElement);
                clonedDeleteFlagElement.val(1);
              }
              
              // Take the element that contains the model ID and clone it and prepend it to the parent
              var hiddenIdElement = $($elem.attr('data-hidden-id'), $parent);
              if(hiddenIdElement != null) {
                var clonedhiddenIdElement = hiddenIdElement.clone();
                $parent.parents().first().prepend(clonedhiddenIdElement);
              }              

              $parent.remove();
            }
          ],
          '.listing .actions': [
            'click', function (e) {
              var $head = $('.listing .header', $(this).fluxxCard());
              if ($head.hasClass('actions-open')) {
                $head.removeClass('actions-open');
              } else {
                $head.addClass('actions-open');
              }
            }
          ],
          'a.toggle-visible': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var targets = $(this).attr('data-selector');
              if (!targets) return;
              var $targets = $(targets, $(this).fluxxCardArea());
              _.each($targets, function(target) {
                var $target = $(target);
                $target[$target.is(':visible') ? 'hide' : 'show']();
              });
            }
          ],
          'a.open-filters': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              if ($('.filters', $(this).fluxxCard()).length) {
                $(this).closeListingFilters();
              } else {
                $(this).openListingFilters();
              }
            },
            function(e) {
              $.fluxx.util.itEndsWithMe(e);
            }
          ],
          '[data-related-child]': [
            'change', function (e) {              
              var updateChild = function ($child, parentId) {
                var query = {};
                query[$child.attr('data-param')] = parentId;
                $.getJSON($child.attr('data-src'), query, function(data, status) {
                  if ($child.attr('data-required')) {
                    $child.empty();
                  } else {
                    $child.html('<option></option>');
                  }
                  _.each(data, function(i){ $('<option></option>').val(i.value).html(i.label).appendTo($child)  });
                  $child.val($child.children().first().val()).change();
                });                  
              };

              var updateChildren = function($children, parentId) {
                $children.each(function(){
                  updateChild($(this), parentId);
                });
              }

              var $parent   = $(this),
                  $children = $($parent.attr('data-related-child'), $parent.parents('form').eq(0));

              if ($parent.attr('data-sibling')) {
                $('[data-sibling='+ $parent.attr('data-sibling') +']', $parent.parent()).not($parent)
                  .one('change', function(){
                    updateChildren($children, $(this).val());
                  });
              } else {
                updateChildren($children, $parent.val());
              }
            }
          ],
          'a.to-dashboard': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $selected = $(this);
              if ($selected.parent().hasClass('selected'))
                return;
              var $previous = $('.selected a', $.my.dashboardPicker);
              $previous.data('locked', true);
              $selected.data('locked', true);
              $.my.lookingGlass.hide();
              $.my.cards.each(function() {
                var $card = $(this);
                $.my.dock.removeViewPortIcon({card: $(this)});
                $card.remove();
              });              
              var dashboard = $selected.data('dashboard');
              if (dashboard && dashboard.data && dashboard.data.cards) {
                $('a.to-dashboard[href*=' + dashboard.url + ']').parent().addClass('selected').siblings().removeClass('selected');
                $.my.hand
                  .addFluxxCards({cards: dashboard.data.cards}, function(){
                    $selected.data('locked', false);
                    $previous.data('locked', false);
                  });
                $.cookie('dashboard', dashboard.url);
              } else {
                $selected.data('locked', false);
                $previous.data('locked', false);
              }
            }
          ],
          'a.new-dashboard': [
             'click', function(e) {
               $.fluxx.util.itEndsWithMe(e);
               $.my.dashboardPicker.newDashboard(e);
             }
           ],
           'a.manage-dashboard': [
             'click', function(e) {
               $.fluxx.util.itEndsWithMe(e);
               $.my.dashboardPicker.openManager();
             }
           ],
           'a.delete-dashboard': [
              'click', function(e) {
                $.fluxx.util.itEndsWithMe(e);
                var dashboard = $(this).parent().parent().parent().find('a.to-dashboard').data('dashboard');
                $('#manager-container').fadeTo(500,0.2);
                jConfirm('<p>You are about to delete the dashboard</p><span class="manager-title">' + dashboard.name + '</span>', 
                  'Can you confirm this?', function(r) {
                    $('#manager-container').fadeTo(500, 1);
                    if (r)
                      $.my.dashboardPicker.deleteDashboard(dashboard);
                });
              }
            ],
            'a.rename-dashboard': [
               'click', function(e) {
                 $.fluxx.util.itEndsWithMe(e);
                 var dashboard = $(this).parent().parent().parent().find('a.to-dashboard').data('dashboard');
                 $('#manager-container').fadeTo(500,0.2);
                 jPrompt('Rename dashboard ' + dashboard.name + ' to:', 
                   dashboard.name, '', function(r) {
                   $('#manager-container').fadeTo(500, 1);
                   if (r)
                     $.my.dashboardPicker.renameDashboard(dashboard, r);
                 });
               }
             ],
          'a.to-upload': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              $.modal('<div class="upload-queue"></div>', {
                minWidth: 700,
                minHeight: 400,
                closeHTML: '<span>Close</span>',
                close: true,
                closeOverlay: true,
                escClose:true,
                opacity: 50,
                onShow: function () {
                  $('.upload-queue').pluploadQueue({
                    url: $elem.attr('href'),
                    runtimes: 'html5',
                    multipart: false,
                    filters: [{title: "Allowed file types", extensions: $elem.attr('data-extensions')}]
                  });
                },
                onClose: function(){
                  if ($elem.parents('.partial').length) {
                    $elem.refreshAreaPartial();
                  } else {
                    $elem.refreshCardArea();
                  }
                  $.modal.close();
                }
              });
            }
          ],
          'a.to-modal': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              $elem.openCardModal({
                url:    $elem.attr('href'),
                header: $elem.attr('title') || $elem.text(),
                target: $elem
              });
            }
          ],
          'a.close-modal': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              $(this).closeCardModal();
            }
          ],
          'a.close-parent': [
            'click', function(e){
              $.fluxx.util.itEndsWithMe(e);
              $(this).parent('div:first').fadeOut(250,function(){
                var $card = $(this).fluxxCard();
                var $area = $(this).fluxxCardArea();
                $(this).remove();
                $('.header,.body,.footer', $area).filter(':empty').addClass('empty');
                $card.resizeFluxxCard();
              });
            }
          ],
          'a.to-self':   [
            'click', function (e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              $elem.fluxxCardLoadContent({
                url: $elem.attr('href'),
                area: $elem.fluxxCardArea()
              });
            }
          ],
          'a.to-listing': [
            'click', function (e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              $elem.fluxxCardLoadListing({
                url: $elem.attr('href')
              });
            }
          ],
          'form.to-listing': [
            'submit', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              $elem.fluxxCardLoadListing({
                url: $elem.attr('action'),
                type: $elem.attr('method'),
                data: $elem.serializeArray()
              });
            }
          ],
          'form.filters-form': [
            'submit', function(e) {
              var $elem = $(this);
              $elem.closeListingFilters();
            }
          ],
          '.tabs-right': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              var $tabs = $('.tabs', $elem.fluxxCard());
              $tabs.scrollTop( $tabs.scrollTop() + 30 );
            }
          ],
          '.tabs-left': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              var $tabs = $('.tabs', $elem.fluxxCard());
              $tabs.scrollTop( $tabs.scrollTop() - 30 );
            }
          ],
          '.tabs .label': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this), label = $elem.text(), $card = $elem.fluxxCard();
              if ($elem.hasClass('selected')) {
                $elem.removeClass('selected');
                $('.info', $card).removeClass('open').resizeFluxxCard();
              } else {
                $elem.addClass('selected').parent().siblings().children().removeClass('selected');
                $('.drawer .entries', $card).removeClass('selected');
                $('.drawer .label:contains('+label+')', $card).siblings().addClass('selected');
                $('.info', $card).addClass('open', 1000, function(){
                  $card.resizeFluxxCard();
                  $('a.scroll-to-card[href=#' + $card.attr('id') + ']', $.my.dock.iconlist).click()
                ;});
              }
            }
          ],
          'li.entry a': [
            'click', function(e) {
              var $elem = $(this);
              var $entry = $elem.parent();
              $entry.removeClass('latest').addClass('selected').siblings().removeClass('selected');
            }
          ],
          'a.close-card': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              $(this).removeFluxxCard(); 
            }
          ],
          'a.minimize-card, a.maximize-card': ['click', function (e) {
            $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              $elem.minimizeFluxxCard();
            }
          ],
          'a.to-detail': ['click', function (e) {
            $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              $elem.fluxxCardLoadDetail({
                url: $elem.attr('href')
              });
            }
          ],
          'a.area-url': [
            'click', function(e) {
              var $elem = $(this);
              $elem.attr('href', $elem.fluxxCardAreaURL());
            }
          ],
          'a.area-data': [
            'click', function(e) {
              var $elem = $(this);
              $elem.attr('href', $elem.attr('href') + '?' + $.param($elem.fluxxCardAreaData()))
            }
          ],
          'a.dock-list-scroller': [
             'click', function(e) {
               $.my.dock.fluxxDockUpdateViewing(e);
             }
          ],
          'form.area-url': [
            'submit', function(e) {
              var $elem = $(this);
              $elem.attr('action', $elem.fluxxCardAreaURL({without: $elem.serializeArray()}));
            }
          ],
          'form.to-self': [
            'submit', function (e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              var properties = {
                area: $elem.fluxxCardArea(),
                url: $elem.attr('action'),
                data: $elem.serializeArray()
              };
              if ($elem.attr('method'))
                properties.type = $elem.attr('method');
              $elem.fluxxCardLoadContent(properties)
            },
          ],
          'input[data-autocomplete]': [
            'focus', function (e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              if ($elem.data('autocomplete_initialized')) return;
              $elem.data('autocomplete_initialized', 1);

              var endPoint = $elem.attr('data-autocomplete');
              
              $elem.autocomplete({
                source: function (query, response) {
                  $.getJSON(
                    endPoint,
                    query,
                    function(data, status){
                      response(data);
                    }
                  );
                },
                focus: function (e, ui) {
                  $elem.val(ui.item.label);
                  return false;
                },
                select: function (e, ui) {
                  $elem.val(ui.item.label);
                  $elem
                    .parent()
                    .find('input[data-sibling='+ $elem.attr('data-sibling') +']')
                    .not($elem)
                    .val(ui.item.value)
                    .change();
                  return false;
                }
              });
            }
          ],
          'a.scroll-to-card': [
            'click', function(e) {
              $.fluxx.util.itEndsHere(e);
              var target = $(this).attr("href");
              var $card = $(target);
              $card.resizeFluxxCard();
              var targetLeft = $card.offset().left;
              var margin = $card.fluxxCardMargin();
              var screenWidth = $(window).width();
              var scrollMiddle = $(window).scrollLeft() + (screenWidth / 2);
              var targetMiddle = targetLeft  + ($card.outerWidth() / 2);
              var scrollToRight = (scrollMiddle < targetMiddle);
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
              //perform animated scrolling
              $('html,body').stop().animate(
              {
                scrollLeft: targetLeft
              },1000,function()
              {
                location.hash = target;
              });
            }
          ],
          'div.toolbar': [
            'mousedown', function(e) {
              var $window = $('html,body');
              $('#fluxx').css('-webkit-user-select', 'none').css('-moz-user-select', 'none');
              $window.data('lastPageX', e.pageX);
              $window.mousemove(function(e) {
                var $window = $('html,body');
                if ($window.data('skipScroll')) {
                  $window.data('skipScroll', false);
                  return;
                }
                $window.data('skipScroll', true);
                var lastPageX = $window.data('lastPageX');
                var offset = lastPageX - e.pageX;
                var scrollLeft = $(window).scrollLeft() + offset;
                $window.data('lastOffset', offset);
                $window.data('lastPageX', e.pageX + offset);
                $window.scrollLeft(scrollLeft);
              });           
            }
          ],
          'html,body': [
            'mouseup', function(e) {
              var $window = $('html,body');
              $window.unbind('mousemove');
              $('#fluxx').css('-webkit-user-select', 'auto').css('-moz-user-select', 'auto');              
              var lastOffset = $window.data('lastOffset');
              $window.stop().animate({scrollLeft: '+=' + lastOffset}); 
            }
          ]
        }
      }
    }
  });
  $.fluxx.stage.ui.header = function(options){return $.fluxx.util.resultOf([
    '<div id="header">',
      '<div id="logo"><a href=".">FLUXX</a></div>',
        '<ul class="actions">',
          _.map($.fluxx.config.header.actions, function(action) {
            return ['<li>', action, '</li>'];
          }),
        '</ul>',
    '</div>'
  ])};
  $.fluxx.stage.ui.cardTable = [
    '<div id="card-table">',    
      '<ul id="hand">',
      '</ul>',
    '</div>'
  ].join('');
  $.fluxx.stage.ui.footer = [
    '<div id="footer"></div>'
  ].join('');
  
  $(window).resize(function(e){
    if (!$.my.stage) return;
    $.my.stage.resizeFluxxStage();
  });

})(jQuery);
