(function($){
  $.fn.extend({
    renderChart: function() {
      var dataURL = '';
      return this.each(function() {
        var $chart = $(this);
        var chartID = 'chart' + $.fluxx.visualizations.counter++;

        var dataURL = $chart.attr('data-src');
        var query = {'request_ids': $chart.attr('request-ids')};
        if (dataURL) {
          //TODO: This isn't working
          //$('.loading-indicator', $chart.fluxxCard()).addClass('loading');

          $.getJSON(dataURL, query, function(data, status) {
            $chart.html("").append('<div id="' + chartID + '"></div>');
            //$('.loading-indicator', $chart.fluxxCard()).removeClass('loading');
            $.jqplot.config.enablePlugins = true;

            plot1 = $.jqplot(chartID, data.data, {
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
