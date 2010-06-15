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
end

use Rack::FluxxBuilder

root=Dir.pwd
puts ">>> Serving: #{root}"
run Rack::Directory.new("#{root}")
