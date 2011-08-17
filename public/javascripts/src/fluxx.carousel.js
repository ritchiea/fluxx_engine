(function($) {
  $.fn.carousel = function (options) {
    var defaults = {
    };

    options = $.extend(defaults, options);

    return this.each(function () {
      var $area = $(this);
      $('.panel', $area).hide().first().show();

      $area.find('.panel').each(function(){
        var $panel = $(this);
        var title = $panel.attr('data-title') || '';
        $panel.prepend('<div class="panel-header">' + title + '<a href="#" class="close-summary">&nbsp;</a></div>');
      });

    });
  };
})(jQuery);

