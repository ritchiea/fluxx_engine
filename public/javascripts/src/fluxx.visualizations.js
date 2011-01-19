(function($){
  $.fn.extend({
    renderChart: function() {
      return this.each(function() {
        var $chart = $(this);
        if ($chart.children().length > 0)
          return;

        var data = $.parseJSON($chart.html());
        $chart.html('').show().parent();
        var chartID = 'chart' + $.fluxx.visualizations.counter++;

        if (data) {
          if (typeof $chart.fluxxCard == 'function') {
            $card = $chart.fluxxCard();
            $card.fluxxCardDetail().addClass('report-area');
            if (data.hasOwnProperty('class'))
                $card.fluxxCardDetail().addClass(data.class);
            if (data.hasOwnProperty('width'))
                $card.fluxxCardDetail().width(data.width);
          }

          $chart.html("").append('<div id="' + chartID + '"></div>');
          $.jqplot.config.enablePlugins = true;

          if (data.type == 'bar') {
            if (!data.seriesDefaults)
              data.seriesDefaults = {};
            data.seriesDefaults.renderer = $.jqplot.BarRenderer;
          }

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
            grid:{background:'#fefbf3', borderWidth:2.5},
            seriesDefaults: data.seriesDefaults,
            axes: data.axes,
            series: data.series
          });
          $.fluxx.log('---------------------------------', plot.series);
          var colors = {};
          _.each(plot.series, function(key) {
            colors[key.label] = key.color;
          });
          $('.legend table.legend-table tr').each(function() {
           var $td = $('td:first', $(this))
           if ($td.length) {
             $td.prepend('<span class="legend-color-swatch" style="background-color: ' + colors[$.trim($td.text())] + '"/>');
//            $td.css('background-color', colors[$.trim($td.text())]);
           }
          });

          // TODO Remove this
          if (data.description)
            $chart.append('<div class="description">' + data.description + '</div>');
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
