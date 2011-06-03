require "rails"
require "action_controller"
require "active_record"
require "logger"

unless defined?(FLUXX_LOGGER)
  FLUXX_LOGGER = Logger.new(STDERR)
  FLUXX_LOGGER.formatter = proc { |severity, time, prog, msg| 
    "[#{time.strftime("%Y-%m-%d %H:%M:%S")}] #{severity}  #{msg}\n" 
  }
end

module Fluxx
  def self.logger=(logger)
    @logger = logger
  end
  def self.logger
    @logger ||= FLUXX_LOGGER
  end
end

module FluxxEngine
  class Engine < Rails::Engine
    config.i18n.load_path += Dir["#{File.dirname(__FILE__).to_s}/../../config/fluxx_locales/*.{rb,yml}"]
    initializer 'fluxx_engine.add_compass_hooks', :after=> :disable_dependency_loading do |app|
      Fluxx.logger.debug "Loaded FluxxEngine"
      Sass::Plugin.add_template_location "#{File.dirname(__FILE__).to_s}/../../app/stylesheets", "public/stylesheets/compiled/fluxx_engine"
    end
    rake_tasks do
      load File.expand_path('../../tasks.rb', __FILE__)
    end
  end
end
