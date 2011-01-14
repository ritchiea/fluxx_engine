(function($){
  $.fn.extend({
    renderChart: function() {
      return this.each(function() {
        var $chart = $(this);
        if ($chart.children().length > 0)
          return;

        var data = $.parseJSON($chart.html());
        $.fluxx.log('********> RenderChart', data);
        $chart.html('').show().parent();
        var chartID = 'chart' + $.fluxx.visualizations.counter++;

        if (data) {
          $card = $chart.fluxxCard();
          $card.fluxxCardDetail().addClass('report-area');

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
            title: data.title,
            height: 450,
            width: 220,
            stackSeries: data.stackSeries,
            legend:{show: true},
            grid:{background:'#fefbf3', borderWidth:2.5},
            seriesDefaults: data.seriesDefaults,
            axes: data.axes,
            series: data.series
          });
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
