module Rack
  class FluxxBuilder
    def initialize app
      @app = app
      Sass::Plugin.update_stylesheets
      DirectorySync.sync_all
    end
    def call env
      unless SKIP_FLUXX_BUILDER
        path = Utils.unescape(env["PATH_INFO"])
        t1 = Time.now
        if path.match('\.css$')
          Sass::Plugin.update_stylesheets
        elsif path.match('\.js$') || path.match('\.jpg$') || path.match('\.gif$') || path.match('\.png$') || path.match('\.svg$') || path.match('\.ttf$') || path.match('\.woff$') || path.match('\.eot$') || path.match('\.svg$')
          DirectorySync.sync_all path
        end
        t2 = Time.now
      end
      @app.call env
    end
  end
end