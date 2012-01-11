(function($){
  $.fn.extend({
    renderChart: function() {
      return this.each(function() {
        var $chart = $(this);
        if ($chart.children().length > 0)
          return;

        var data = $.parseJSON($chart.html());
        var saveHTML = $chart.html();
        $chart.html('').show().parent();
        var chartID = 'chart' + $.fluxx.visualizations.counter++;
        if (data) {
          var $card;

          if (typeof $chart.fluxxCard == 'function') {
            $card = $chart.fluxxCard();
          } else {
            $card = $('#hand');
          }
          if (data.hasOwnProperty('class'))
              $card.fluxxCardDetail().addClass(data['class']);
          if (data.hasOwnProperty('width'))
              $card.fluxxCardDetail().width(data.width);

          $chart.html("").append('<div id="' + chartID + '"></div>');
          $.jqplot.config.enablePlugins = true;

          if (data.type == 'bar') {
            if (!data.seriesDefaults)
              data.seriesDefaults = {};
            data.seriesDefaults.renderer = $.jqplot.BarRenderer;
          }

          if (data.series) {
            $.each(data.series, function(i, s) {
              if (s.renderer) {
                s.renderer = eval(s.renderer);
              }
            });
          }


         if (data.axes && data.axes.xaxis && data.axes.xaxis.ticks.length > 0 && !$.isArray(data.axes.xaxis.ticks[0]))
           data.axes.xaxis.renderer = $.jqplot.CategoryAxisRenderer;
         var error = false;
         try {
           plot = $.jqplot(chartID, data.data, {
            axesDefaults: {
              tickRenderer: $.jqplot.CanvasAxisTickRenderer ,
              tickOptions: {
                fontSize: '10pt'
              }
            },
            title: {show: false},
            width: $chart.css('width'),
            stackSeries: data.stackSeries,
//            grid:{background:'#fefbf3', borderWidth:2.5},
            grid:{background:'#ffffff', borderWidth:0, gridLineColor: '#ffffff', shadow: false},
            seriesDefaults: data.seriesDefaults,
            axes: data.axes,
            series: data.series
           });

         } catch(e) {
//           $.fluxx.log('error', e);
           $chart.html('<h4>No data available</h4>').height(50).css({"text-align": "center"});
           error = true;
         }
         if (!error) {
            var legend = {};
            $.each(plot.series, function(index, key) {
              legend[key.label] = key;
            });

            var $table =  $('.legend table.legend-table', $card);
            if ($table.hasClass('single-row-legend')) {
              $table.find('.category').each(function () {
                var $cat = $(this);
                var l = legend[$.trim($cat.text())];
                if (l)
                  $cat.prepend('<span class="legend-color-swatch" style="background-color: ' + l.color + '"/>');
              });
            } else {
              $table.find('tr').each(function() {
               var $td = $('td:first', $(this));
               if ($td.length) {
                 var l = legend[$.trim($td.text())];
                 if (l)
                  $td.prepend('<span class="legend-color-swatch" style="background-color: ' + l.color + '"/>');
               }
              })
              .hover(function(e) {
                var $td = $('td:first', $(this));
                if (legend[$.trim($td.text())])
                  legend[$.trim($td.text())].canvas._elem.css('opacity', '.5');
              }, function(e) {
                var $td = $('td:first', $(this));
                if (legend[$.trim($td.text())])
                  legend[$.trim($td.text())].canvas._elem.css('opacity', '1');
              });
            }
          }
        }
      });
    }
  });
  $.extend(true, {
    fluxx: {
      visualizations: {
        counter: 0
      }
    }
  });

})(jQuery);
