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
            $.colorbox.init,
            options.callback
          )
        });
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
    
    addFluxxCards: function(options) {
      var options = $.fluxx.util.options_with_callback({}, options);
      if (!options.cards.length) return this;
      $.each(options.cards, function() { $.my.hand.addFluxxCard(this) });
      return this;
    },
    
    installFluxxDecorators: function() {
      _.each($.fluxx.stage.decorators, function(val,key) {
        $(key).live(val[0], val[1]);
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
      stage: {
        attrs: {
          id: 'stage'
        },
        ui: function(optoins) {
          return $('<div>')
            .attr($.fluxx.stage.attrs)
            .html($.fluxx.util.resultOf([
              $.fluxx.stage.ui.header,
              $.fluxx.stage.ui.cardTable,
              $.fluxx.stage.ui.footer
            ]));
        },
        decorators: {
          'a.new-detail': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              $.my.hand.addFluxxCard({
                detail: {url: $elem.attr('href')},
                title: ($elem.attr('title') || $elem.text())
              })
            }
          ],
          'a.new-listing': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              $.my.hand.addFluxxCard({
                listing: {url: $elem.attr('href')},
                title: ($elem.attr('title') || $elem.text())
              })
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
              $elem.fluxxCardLoadContent({
                area: $elem.fluxxCardArea(),
                url: $elem.attr('href'),
                type: 'POST'
              });
            }
          ],
          'a.as-delete': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              $elem.fluxxCardLoadContent({
                area: $elem.fluxxCardArea(),
                url: $elem.attr('href'),
                type: 'DELETE'
              });
            }
          ],
          'select[data-related-child]': [
            'change', function (e) {
              var $parent   = $(this),
                  parentId  = $parent.val(),
                  $child    = $($parent.attr('data-related-child'), $parent.parents('form').eq(0)),
                  query     = {};
              query[$child.attr('data-param')] = parentId;
              $.getJSON($child.attr('data-src'), query, function(data, status) {
                $child.html('<option></option>');
                _.each(data, function(i){ $('<option></option>').val(i.value).html(i.label).appendTo($child)  });
              });
            }
          ],
          'a.to-upload': [
            'click', function(e) {
              $.fluxx.util.itEndsWithMe(e);
              var $elem = $(this);
              $.colorbox({
                html: '<div class="upload-queue"></div>',
                width: 700,
                height: 400,
                onComplete: function () {
                  $.fluxx.log("onComplete start");
                  $('.upload-queue').pluploadQueue({
                    url: $elem.attr('href'),
                    runtimes: 'html5',
                    multipart: false,
                    filters: [{title: "Allowed file types", extensions: $elem.attr('data-extensions')}]
                  });
                  $.fluxx.log("onComplete stop");
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
          ]
        }
      }
    }
  });
  $.fluxx.stage.ui.header = [
    '<div id="header">',
      '<div id="logo"><a href=".">FLUXX</a></div>',
      '<ul class="actions">',
      '</ul>',
    '</div>'
  ].join('');
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
