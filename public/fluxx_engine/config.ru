require 'json'

module Rack
  class FluxxBuilder
    def initialize app
      @app = app
    end
    def call env
      `rake build`
      @app.call env
    end
  end
  class FluxxRTUPolling
    def initialize app
      @app = app
      @counter = 0
    end
    def call env
      path = Utils.unescape(env["PATH_INFO"])
      if path.match(/rtu_polling$/)
        @counter = @counter + 1
        body = {'counter' => @counter}.to_json
        size = body.respond_to?(:bytesize) ? body.bytesize : body.size
        return [
          200,
          {'Content-type' => 'application/json', 'Content-Length' => size.to_s},
          body
        ]
      else
        return @app.call env
      end
    end
  end
end

use Rack::FluxxBuilder
use Rack::FluxxRTUPolling

root=Dir.pwd
puts ">>> Serving: #{root}"
run Rack::Directory.new("#{root}")
