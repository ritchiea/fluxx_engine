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
        $found = $('.item a[href="'+$.cookie('dashboard')+'"]', $(this));
        if ($found.length)
          $item = $found;
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
      if (!dashboard)
        return;
      if (!dashboard.data)
        dashboard.data = {"cards": [], "nextUid": 1};
      dashboard.data.cards = $.my.stage.serializeFluxxCards();
      dashboard.data.nextUid = $.fluxx.dashboard.attrs['nextUid'];
      $dashboard.parent().addClass('saving');
      $.fluxx.storage.updateStored({store: dashboard}, function(dashboard){
        $dashboard.data('dashboard', dashboard).parent().removeClass('saving');
      });
     // $.fluxx.log($dashboard.data('dashboard'), $.my.stage.serializeFluxxCards());

      return this;
    },
    newDashboard: function(e) {
      var $dashboard = $('.selected a', $.my.dashboardPicker);
      $dashboard.parent().addClass('saving');

      var hasTemplates = false;
      var dashboardTemplates = {};
      $.ajax({
        url: '/dashboard_templates.json',
        success: function(data, status, xhr) {
          hasTemplates = data.total_entries > 0;
          dashboardTemplates = data;
        },
        complete: function() {
          $dashboard.parent().removeClass('saving');
          if (!hasTemplates) {
            $(e.target).after(
              $('<input type="text" class="new-dashboard-input"/>').keypress(function(e){
                if (e.which == 13 || e.which == 10) {
                  e.preventDefault();
                  var name = $(e.target).val();
                  if (name.length > 0) {
                    $.my.dashboardPicker.createDashboardFromTemplate(newDashboard, name);
                  } else {
                    $(e.target).hide().prev().show();
                  }
                }
              }).select()
            ).hide();
            $('.new-dashboard-input').focus();
          } else {
            var manager = $.fluxx.dashboard.manager;
            manager.initNewDashboardModal(dashboardTemplates.records);
          }
        }
      });
    },
    openManager: function() {
     var manager = $.fluxx.dashboard.manager;
     manager.init();
    },
    deleteDashboard: function(dashboard) {
     $.fluxx.storage.deleteStored({store: dashboard}, function(item) {
       var $li = $('a.to-dashboard[href*="' + dashboard.url + '"]').parent().remove();
       if ($li.hasClass('selected')) {
         var $first = $('a.to-dashboard').first();
         if ($first.length > 0)
           $first.click();
         else {
           $('.dashboard').remove();
           $.my.header.initFluxxDashboard();
           $('a.simplemodal-close').click();
         }
       }
     });
    },
    deleteDashboardTemplate: function($elem) {
      $.ajax({
        url: $elem.attr('href'),
        type: 'DELETE',
        success: function (){
          $elem.parent().remove();
        },
        error: function (jqXHR, textStatus, errorThrown) {
          alert('Error thrown renaming dashboard template ' + name +'. ' + textStatus);
        }
      });
    },
    renameDashboard: function(dashboard, name) {
      dashboard.name = name;
      $.fluxx.storage.updateStored({store: dashboard}, function(dashboard){});
      $('a.to-dashboard[href*="' + dashboard.url + '"]').html(name);
    },
    renameDashboardTemplate: function($elem, name) {
      var data = {dashboard_template: {name: name}};
      $.ajax({
        url: $elem.attr('href'),
        type: 'PUT',
        data: data,
        success: function (){
          $elem.html(name).data('dashboard-template-name', name);
        },
        error: function (jqXHR, textStatus, errorThrown) {
          alert('Error thrown renaming dashboard template ' + name +'. ' + textStatus);
        }
      });
    },
    addDashboardTemplate: function(dashboard, name) {
      var $card = $(this).fluxxCard();
      dashboard.name = name;
      if (!dashboard)
        return;
      var data = {dashboard_template: {
            name: name,
            data: $.toJSON(dashboard),
          }
        };

      $.ajax({
        type: 'POST',
        url: '/dashboard_templates',
        data: data,
        success: function (xhr, status) {
          alert('Dashboard template ' + name +' has been successfully created.');
        },
        error: function (jqXHR, textStatus, errorThrown) {
          alert('Error thrown saving dashboard template ' + name +'. ' + textStatus);
        }
      })
    },
    createDashboardFromTemplate: function(template, name) {
      if (name.length) {
        var dashboard = jQuery.extend(true, {cards: [], nextUid: 1}, template);
        dashboard.name = name;
        $(dashboard).data('nextUid', 1);
        $.fluxx.storage.createStore(dashboard, function(item) {
          $($.fluxx.dashboard.ui.pickerItem({url: item.url, name: item.name}))
          .find('a').data('dashboard', item)
          .end()
          .appendTo($.my.dashboardPicker)
          .find('a').trigger('click');
        });
        $.fluxx.dashboard.attrs['nextUid.r'] = dashboard.data.nextUid;
        $('.simplemodal-close').click();
      }
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
            data: {cards: [], nextUid: 1},
            url: '#default'
          }
        }
      },
      dashboard: {
        nextUid: function () {
          var curNextUid = this.attrs['nextUid'];
          this.attrs['nextUid'] = curNextUid + 1;
          return curNextUid;
        },
        
        attrs: {
        },
        defaults: {
        },
        lastSave: {},
        ui: function(options) {
          if (!options)
            options = {};

          return $('<li>')
            .addClass('dashboard')
            .attr($.fluxx.dashboard.attrs)
            .html($.fluxx.util.resultOf([
              '<li>',
                '<span class="label">Dashboard:</span>',
                '<ul class="picker">',
                  '<li class="combo"><div>&#9650;</div><div>&#9660;</div></li>',
                  '<li class="new"><a href="#" class="new-dashboard">New</a></li>',
                  '<li class="manage"><a href="#" class="manage-dashboard">Manage</a></li>',
                '</ul>',
              '</li>'
            ]))
        },
        manager: {
          initNewDashboardModal: function (templates) {

            var dashboards = '<li data-tick="✓" class="item"><a class="new-dashboard from-template" href="#http://farash:3000/client_stores">New Blank Dashboard</a></li>';
            var data = [];
            $.each(templates, function(i, obj) {
              var numCards = 0;
              var template = null;
              try {
                if (obj.dashboard_template.data ) {
                  template = $.parseJSON(obj.dashboard_template.data);
                  obj.dashboard_template.data = template.data;
                }
                data.push(template);
                if (template && template.data && template.data.cards) {
                  numCards = template.data.cards.length;
                }
              } catch(e) {

              }
              dashboards += '<li data-tick="✓" class="item"><a class="new-dashboard from-template" data-dashboard-template-name="' + obj.dashboard_template.name + '" data-dashboard-template-id="' + i + '" href="/dashboard_templates/' + obj.dashboard_template.id +'">' + obj.dashboard_template.name + '</a>' +
                '<ul class="actions">' +
                '<li><a href="#" class="rename-dashboard dashboard-template"></a></li>' +
                '<li><a class="delete-dashboard dashboard-template"></a></li>' +
                '</ul><div class="manager-card-count">' +
                numCards +
                ' cards</div></li>';
            });
            var $dashboards = $('<h1 class="manager-title">Create New Dashboard</h1><ul class="manager-list">' + dashboards + '</ul><br/>');
            $dashboards.modal({
              closeHTML: "<a href='#' title='Close' class='modal-close'>x</a>",
              position: ["15%",],
              overlayId: 'manager-overlay',
              containerId: 'manager-container',
              onOpen: this.open,
              onClose: this.close
            });
            $('body').data('dashboard-templates', templates);
          },
          init: function () {

            var $dashboards = $.my.dashboardPicker
              .find('.item')
              .clone(true)
              .wrapAll('<ul class="manager-list" />')
              .parent()
              .before('<h1 class="manager-title">My Dashboards</h1>');

            $dashboards.find('li').each(function() {
              var $item = $('a', $(this));
              var dashboard = $item.data('dashboard');
              if (dashboard.data)
                $item.after(
                  ($.fluxx.config.can_add_dashboard_templates ? ' - <a href="#" class="add-dashboard-template">Add as template</a>' : '') +
                   '<ul class="actions"><li><a href="#" class="rename-dashboard"/></li>' +
                   '<li><a href="#" class="delete-dashboard"/></li>' +
                   '</ul><div class="manager-card-count">' +
                   dashboard.data.cards.length +
                   ' cards</div>');
            });
            $dashboards.modal({
              closeHTML: "<a href='#' title='Close' class='modal-close'>x</a>",
              position: ["15%",],
              overlayId: 'manager-overlay',
              containerId: 'manager-container',
              onOpen: this.open,
              onClose: this.close
            });
          },
          open: function(dialog) {
            dialog.overlay.fadeIn(200, function () {
              dialog.container.fadeIn(200, function () {
                dialog.data.fadeIn(200)
              });
            });
          },
          close: function(dialog) {
            dialog.data.fadeOut(200, function () {
              dialog.container.fadeOut(200, function () {
                dialog.overlay.fadeOut(200, function () {
                  $.modal.close();
                });
              });
            });
          }
        }
      },
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
    var history = $area.data('history');
    if (history && history[0] && history[0].type && (history[0].type.toUpperCase() == 'GET' && ($area.hasClass('detail') || $area.hasClass('listing'))) && !$(this).fluxxCard().fromClientStore()) {
        $(this).saveDashboard();
    }
  });
  $('.card').live('unload.fluxx.area', function(e) { $(this).saveDashboard(); });

})(jQuery);
