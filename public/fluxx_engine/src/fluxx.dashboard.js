(function($){
  $.fn.extend({
    initFluxxDashboard: function(options, complete) {
      $.fluxx.dashboard.ui.call(this)
        .prependTo($('.actions', $.my.header))
        .populateDashboards(_.bind($.fn.loadDashboard, $('.picker')));
    },
    populateDashboards: function (fn) {
      var $dashboard = this;
      $dashboard.getDashboardList(function(list){
        _.each(list, function(i) {
          var $item = $($.fluxx.dashboard.ui.pickerItem.call($dashboard, i));
          $('a', $item).data('dashboard', i);
          $item.appendTo($('.picker', $dashboard));
        });
        fn();
      });
      return $dashboard;
    },
    loadDashboard: function () {
      var $item = $('.item:first a', $(this));
      if ($.cookie('dashboard')) {
        $item = $('.item a[href='+$.cookie('dashboard')+']', $(this));
      }
      $.cookie('dashboard', $item.click().attr('href'));
      $item.parent().addClass('selected').siblings().removeClass('selected');
    },
    
    getDashboardList: function (fn) {
      $.fluxx.storage.get('dashboard', function(obj) {
        if (!obj.value()) {
          obj.setValue($.fluxx.config.dashboard.default_dashboard);
        }
        fn(obj.value());
        $.cache.dashboard = obj;
      });
    },
    
    saveDashboardState: function() {
      /*
        - Find current dashboard
        - Serialize state of all cards
        - Update entry in current dashboard
        - Get all dashboard names from picker and update
        - Remove any dashboards not in picker
        - Send to server
       */
    },
  });
  
  $.extend(true, {
    fluxx: {
      config: {
        dashboard: {
          enabled: true,
          default_dashboard: [
            {
              id: 'default',
              name: 'Default',
              cards: []
            },
            {
              id: 'scratchpad',
              name: 'Scratch Pad',
              cards: []
            }
          ]
        }
      },
      dashboard: {
        attrs: {
        },
        defaults: {
        },
        ui: function(optoins) {
          return $('<li>')
            .addClass('dashboard')
            .attr($.fluxx.dashboard.attrs)
            .html($.fluxx.util.resultOf([
              '<li>',
                '<span class="label">Dashboard:</span>',
                '<ul class="picker">',
                  '<li class="combo"><div>&#9650;</div><div>&#9660;</div></li>',
                  '<li class="new"><a href="#">New</a></li>',
                  '<li class="manage"><a href="#">Manage</a></li>',
                '</ul>',
              '</li>'
            ]))
        }
      }
    }
  });
  $.fluxx.dashboard.ui.pickerItem = function(options) {
    return $.fluxx.util.resultOf([
      '<li data-tick="&#10003;" class="item">',
        '<a class="to-dashboard" href="#', options.id, '">',
          options.name,
        '</a>',
      '</li>'
    ]);
  };

  $('#stage').live('complete.fluxx.stage', function(e) {
    $.my.header.initFluxxDashboard();
  });

})(jQuery);
