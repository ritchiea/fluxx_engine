(function($){
  $.fn.extend({
    selectTransfer: function(options, callback) {
      var defaults = {
        className: 'select-transfer',
        callback: $.noop
      };
      var options = $.extend(defaults, options, {callback: callback});
      return this.each(function(){
        var $original = $(this);
        var $container = $([
          '<div class="', options.className, '">',
            '<select class="unselected" multiple="multiple"></select>',
            '<div class="controls">',
              '<input type="button" value="&gt;" class="select" />',
              '<div class="break"></div>',
              '<input type="button" value="&lt;" class="unselect"/>',
            '</div>',
            '<select class="selected" multiple="multiple"></select>',
          '</div>'
        ].join('')).css({
          height: 150,
          width: $original.css('width'),
          display: $original.css('display')
        });
        var $unselected = $('.unselected', $container).keydown(function(e){
          if (e.which == 39) {
            $('.select', $container).click();
          }
        });
        var $selected = $('.selected', $container).keydown(function(e){
          if (e.which == 37) {
            $('.unselect', $container).click();
          }
        });

        var $controls = $('.controls', $container);
        $original.find(':selected').appendTo($selected);
        $original.children().appendTo($unselected);

        $('select', $container).css({
          width: '40%',
          height: '100%'
        });
        $controls.css({
          width: '20%',
          display: 'inline-block',
          verticalAlign: 'top',
          textAlign: 'center'
        });
        $('input', $controls).css({
          width: '40%',
          margin: 'auto'
        });
        $('.break', $controls).css({
          height: 24
        })

        $('.select', $container).click(function(e){
          $unselected.find(':selected').remove().appendTo($selected);
        });
        $('.unselect', $container).click(function(e){
          $selected.find(':not(:selected)').remove().appendTo($unselected);
        });

        $original.hide();
        $container.insertAfter($original);        
      });
    }
  });
})(jQuery);
