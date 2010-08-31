(function($){
  function Storage(name, value) {
    var options = $.fluxx.util.options_with_callback({},options);
    this._content = {
      name: name,
      data: value
    };
  }
  $.extend(Storage.prototype, {
    _content: {},
    id: function(){return this._content.id},
    name: function(){return this._content.name},
    value: function(){return this._content.data},
    setContent: function(data) {this._content = data},
    setValue: function(value){
      this._content.data = value;
      return this.save();
    },
    save: function(){
      if (this._content.created_at) {
        if (_.isNull(this.value())) { /* Delete */
          $.fluxx.storage.server._delete(this);
        } else { /* Update */
          $.fluxx.storage.server.update(this);
        }
      } else { /* Create */
        $.fluxx.storage.server.create(this);
      }
      return this;
    },
    get: function(success) {
      var self = this;
      if (!success) success = $.noop;
      $.fluxx.storage.server.show(this, function(data, status, xhr) {
        var entity = {name: self.name()};
        if (_.isArray(data) && data.length) {
          entity = data[0].client_store;
          entity.data = $.parseJSON(entity.data);
        }
        self.setContent(entity);
        success(self);
      });
      return this;
    }
  });

  $.extend(true, $.fluxx, {
    storage: {
      create: function(name, value) { /* Constructor */
        return (new Storage (name, value)).save();
      },
      get: function(name, success) { /* Constructor */
        return (new Storage(name)).get(success);
      },
      
      server: {
        create: function(obj) {
          $.ajax(
            $.extend(
              $.fluxx.config.storage.server.ajax('create', {}), {
              data: {
                client_store: {
                  name: obj.name(),
                  data: $.toJSON(obj.value())
                }
              },
              complete: function(xhr, status) {
                obj.get();
              }
            })
          );
        },
        update: function(obj) {
          $.ajax(
            $.extend(
              $.fluxx.config.storage.server.ajax('update', {id: obj.id()}), {
              data: {
                client_store: {
                  name: obj.name(),
                  data: $.toJSON(obj.value())
                }
              },
              complete: function(xhr, status) {
                obj.get();
              }
            })
          );
        },
        _delete: function(obj, fn) {
          $.ajax(
            $.extend(
              $.fluxx.config.storage.server.ajax('delete', {id: obj.id()}), {
              complete: function(xhr, status) {
                obj = null;
              }
            })
          );
        },
        show: function(obj, success) {
          if (!success) success = $.noop;
          $.ajax(
            $.extend($.fluxx.config.storage.server.ajax('show', {name: obj.name()}), {
              success: success
            })
          )
        }
      }
    },
    
    config: {
      storage: {
        server: {
          base: '/client_stores',
          create:  {type: 'POST',   url: '<%= base %>'},
          update:  {type: 'PUT',    url: '<%= base %>/<%= id %>'},
          'delete': {type: 'DELETE', url: '<%= base %>/<%= id %>'},
          show:    {type: 'GET',    url: '<%= base %>.json/?name=<%= name %>', dataType: 'json'},
          ajax: function(name, params) {
            var action = _.clone($.fluxx.config.storage.server[name]);
            action.url = _.template(
              action.url,
              $.extend(params, {base: $.fluxx.config.storage.server.base})
            );
            return action;
          }
        }
      }
    },
    
    Storage: function () {
      
    }
  });
})(jQuery);
