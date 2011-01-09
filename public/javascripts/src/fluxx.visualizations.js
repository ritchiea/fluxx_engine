(function($){
  $.fn.extend({
    renderChart: function() {
      return this.each(function() {

        var $chart = $(this);
        if ($chart.children().length > 0)
          return;

        var $card = $chart.fluxxCard();

        var data = $.parseJSON($chart.html());
//        $chart.show();
//        return;
        $chart.html('').show().parent();
        var chartID = 'chart' + $.fluxx.visualizations.counter++;

        if (data) {
          $chart.html("").append('<div id="' + chartID + '"></div>');
          $.jqplot.config.enablePlugins = true;

          plot = $.jqplot(chartID, data.data, {
            title: data.title,
            height: 450,
            width: 220,
            stackSeries: true,
            legend:{show: true},
            grid:{background:'#fefbf3', borderWidth:2.5},
            seriesDefaults: data.seriesDefaults,
            axes: data.axes,
            series: data.series
          });
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
