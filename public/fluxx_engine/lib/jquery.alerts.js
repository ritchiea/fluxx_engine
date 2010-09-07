(function($){
  var DEBUG = true;
  var D = function (args) { if (DEBUG) console.log('jquery.colorbox.alerts', args) };
  
  var AlertClass = function (options) {
    var defaults = {
      text: null,
      isCanceled: false
    };
    return $.extend(defaults, options);
  }
  
  var ui = {
    titleBar:     function(o) {return $('<div/>').addClass('title-bar').text(o.text)},
    promptInput:  function(o) {return $('<form class="prompt-form"><textarea class="prompt-input">'+(o.text || '')+'</textarea>')},
    cancelButton: function(o) {return $('<a/>').addClass('btn plain cancel-button').attr('href','#').html(o.text)},
    okButton:     function(o) {return $('<a/>').addClass('btn large green ok-button').attr('href','#').html(o.text)},
    box:          function(o) {
      D(['box', o]);
      var $box = $('<div class="jquery-alert" />');
      $.each(o.elements, function () { $box.append(this) });
      return $('<div/>').append($box).html();
    }
  };

  $.extend($, {
    _box: function (options) {
      if (!options) options = {};
      var onOK = options.onOK; delete options.onOK;      
      var defaults = {
        elements: [ $('<div/>').text('It is a box.') ],
        scrolling: false,
        onShow: function(box){
          $('.cancel-button', '.jquery-alert').click(function(e){
            $.modal.close();
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
          });
          $('.ok-button', '.jquery-alert').click(function(e){
            var $colorbox = box.data;
            var promptInput = $(this).parents('.jquery-alert').find('.prompt-input').val();
            $colorbox.data('onOK', function(){
              if (onOK) {
                onOK(AlertClass({
                  text: promptInput,
                  isCanceled: false
                }));
              }
            });
            $.modal.close();
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
          });
        },
        onClose: function (box) {
          var $colorbox = box.data;
          var onOK = $colorbox.data('onOK');
          if (onOK) {
            onOK();
            $colorbox.data('onOK', null);
          }
        }
      };
      var options = $.extend(defaults, options);

      var html = ui.box({elements: options.elements});
      delete options.elements;
      delete options.title;
      
      if (!options.html) options.html = html;
      options = $.extend(
        {
          closeHTML: '<span>Close</span>',
          close:true,
          overlayClose:true,
          escClose:true,
          onShow:function(d){d.container.hide().fadeIn('slow')},
          onClose:function(d){d.overlay.fadeOut('slow');d.container.fadeOut('slow');$.modal.close()},
          overlayCss:{background:'rgba(0,0,0,0.3)'},
          containerCss:{background:'white'},
          dataCss:{background:'#999'}
        },
        options
      );
      D(options.html, options);
      $.modal(options.html, options);
    },
    prompt: function (options) {
      if (!options) options = {};
      var defaults = {
        elements: [
                    ui.titleBar({text: options.title || 'Prompt'}),
                    ui.promptInput({}),
                    ui.cancelButton({text: 'Cancel'}),
                    ui.okButton({text: 'OK'})
                  ]
      };
      $._box($.extend(defaults, options));
    },
    confirm: function (options) {
      if (!options) options = {};
      var defaults = {
        elements: [
                    ui.titleBar({text: options.title || 'Confirm'}),
                    ui.cancelButton({text: 'Cancel'}),
                    ui.okButton({text: 'OK'})
                  ]
      };
      $._box($.extend(defaults, options));
    },
    alert: function (options) {
      if (!options) options = {};
      var defaults = {
        elements: [
                    ui.titleBar({text: options.title || 'Alert!'}),
                    ui.okButton({text: 'Close'})
                  ],
      };
      $._box($.extend(defaults, options));
    }
  })
})(jQuery);