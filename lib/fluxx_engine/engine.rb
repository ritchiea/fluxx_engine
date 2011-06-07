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
  def self.config key, type = :application
    if defined?(FluxxClient)
      FluxxClient.config key, type
    else
      config = {:application.to_s => FLUXX_CONFIGURATION, :charity_check.to_s => {:username.to_s => defined?(CHARITY_CHECK_USERNAME) ? CHARITY_CHECK_USERNAME : "", :password.to_s => defined?(CHARITY_CHECK_PASSWORD) ? CHARITY_CHECK_PASSWORD : "", :enabled.to_s => (defined?(CHARITY_CHECK_USERNAME) && !CHARITY_CHECK_USERNAME.empty?) ? "1" : "0"}}
      config[type.to_s][key.to_s]
    end
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
