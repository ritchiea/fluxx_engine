(function($){
  $.fn.extend({
    initFluxxDashboard: function(options, complete) {
      $.fluxx.dashboard.ui.call(this)
        .prependTo($('.actions', $.my.header))
        .populateDashboards(_.bind($.fn.loadDashboard, $('.picker')));
    },
    populateDashboards: function (callback) {
      var options = $.fluxx.util.options_with_callback({},callback);
      $.my.dashboardPicker = $('.picker', this);
      $.my.dashboardPicker.getDashboards(options.callback);
    },
    loadDashboard: function () {
      var $item = $('.item:first a', $(this));
      if ($.cookie('dashboard')) {
        $found = $('.item a[href='+$.cookie('dashboard')+']', $(this));
        if ($found.length) {
          $item = $found;
        }
      }
      $.cookie('dashboard', $item.click().attr('href'));
      $item.parent().addClass('selected').siblings().removeClass('selected');
    },
    
    getDashboards: function (callback) {
      var options = $.fluxx.util.options_with_callback({},callback);
      $.fluxx.storage.getStored({type: 'dashboard'}, function(items) {
        if (items && items.length) {
          _.each(items, function(item){
            $($.fluxx.dashboard.ui.pickerItem({url: item.url, name: item.name}))
              .find('a').data('dashboard', item).end()
              .appendTo($.my.dashboardPicker);
          });
          options.callback();
        } else {
          $.fluxx.storage.createStore($.fluxx.config.dashboard.default_dashboard, function(item) {
            $($.fluxx.dashboard.ui.pickerItem({url: item.url, name: item.name}))
              .find('a').data('dashboard', item).end()
              .appendTo($.my.dashboardPicker);
            options.callback();
          });
        }
      });
    },
    
    saveDashboard: function(){
      var $dashboard = $('.selected a', $.my.dashboardPicker);
      if ($dashboard.data('locked')) return this;

      var dashboard = $dashboard.data('dashboard');
      dashboard.data.cards = $.my.stage.serializeFluxxCards();
      $dashboard.parent().addClass('saving');
      $.fluxx.storage.updateStored({store: dashboard}, function(dashboard){
        $dashboard.data('dashboard', dashboard).parent().removeClass('saving');
      });
//      $.fluxx.log($dashboard.data('dashboard'), $.my.stage.serializeFluxxCards());

      return this;
    }
  });
  
  $.extend(true, {
    fluxx: {
      config: {
        dashboard: {
          enabled: true,
          default_dashboard: {
            type: 'dashboard',
            name: 'Default',
            data: {cards: []},
            url: '#default'
          }
        }
      },
      dashboard: {
        attrs: {
        },
        defaults: {
        },
        lastSave: {},
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
        '<a class="to-dashboard" href="#', options.url, '">',
          options.name,
        '</a>',
      '</li>'
    ]);
  };

  $('#stage').live('complete.fluxx.stage', function(e) {
    $.my.header.initFluxxDashboard();
  });
  
  $('.area').live('lifetimeComplete.fluxx.area', function(e) {
    var $area = $(this).fluxxCardArea();
    if (($area.data('history')[0].type.toUpperCase() == 'GET' && ($area.hasClass('detail') || $area.hasClass('listing'))) && !$(this).fluxxCard().fromClientStore()) {
        $(this).saveDashboard();
    }
  });
  $('.card').live('unload.fluxx.area', function(e) { $(this).saveDashboard(); });

})(jQuery);
