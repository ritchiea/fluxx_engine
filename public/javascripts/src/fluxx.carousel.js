(function($) {
  $.fn.carousel = function (options) {
    var defaults = {
    };

    options = $.extend(defaults, options);

    return this.each(function () {
      var $area = $(this);
      $('.carousel', $area).each(function() {
        var $carousel = $(this);
        var showing = parseInt($.cookie($carousel.attr('id'))) || 0;
        var $panels = $carousel.find('.panel');
        var $scrollContainer = $('.panels', $area);
        var scrollWidth = $panels.first().width()
        var buffer = [];
        var scrolling = false;
        var $right = $('.nav-right', $area);
        var $left = $('.nav-left', $area);
        $scrollContainer.css({'margin-left': "-=" + (scrollWidth * showing)});

        $panels.each(function(){
          var $panel = $(this);
          var title = $panel.attr('data-title') || '';
          $panel.prepend('<div class="panel-header">' + title + '<a href="#" class="close-summary">&nbsp;</a></div>');
        });

        showNavigation();

        $right.click(function() {
          if (scrolling) {
            if (buffer.length <= 5)
              buffer.push(true);
            return;
          }
          scrolling = true
          var current = showing;
          showing += 1;
          if (showing >= $panels.length)
            showing = 0;
          scrollIn(current, showing, 'right');
        });

        $left.click(function() {
          if (scrolling) {
            if (buffer.length <= 5)
              buffer.push(false);
            return;
          }
          scrolling = true
          var current = showing;
          showing -= 1;
          if (showing < 0)
            showing = $panels.length - 1;
          scrollIn(current, showing, 'left');
        });

        function scrollIn(last, next, direction) {
          $('.close-summary', $area).hide();
          showNavigation();
          var $temp;
          if (direction == 'right') {
            if (next == 0) {
              $temp = $panels.eq(next).clone();
              $panels.eq(last).after($temp);
            }
            $scrollContainer.animate({'margin-left': '-=' + scrollWidth}, (buffer.length > 0 ? 400 : 1000),function() {
              if ($temp) {
                $(this).css('margin-left', 0);
                $temp.remove();
              }
              checkBuffer();
            });
          } else {
            if (next == $panels.length - 1) {
              $temp = $panels.eq(next).clone();
              $panels.eq(0).before($temp);
              $scrollContainer.css({'margin-left': '-=' + scrollWidth});
            }
            $scrollContainer.animate({'margin-left': '+=' + scrollWidth}, (buffer.length > 0 ? 400 : 1000),function() {
              if ($temp) {
                $temp.remove();
                $scrollContainer.css({'margin-left': "-=" + (scrollWidth * showing)});
              }
              checkBuffer();
            });
          }
        }

        function checkBuffer() {
          scrolling = false;
          if (buffer.length > 0)
            if (buffer.pop())
              $right.click();
            else
              $left.click();
          else {
            $.cookie($carousel.attr('id'), showing);
            $('.close-summary', $area).fadeIn();
          }
        }

        function showNavigation() {
          var $panels = $('.panel', $carousel);
          if ($panels[1])
            $('.nav-left, .nav-right', $area).show();
          else
            $('.nav-left, .nav-right', $area).hide();
          var $nav = $('.carousel-pages', $area);
          $nav.html('');

          $panels.each(function(i) {
            var $bullet = $nav.append('<a class="nav' + (i == showing ? ' selected' : '') +'">x</a>');
          });
        }
      });
    });
  };
})(jQuery);





