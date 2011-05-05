require "rails"
require "action_controller"

module FluxxEngine
  class Engine < Rails::Engine
    config.i18n.load_path += Dir["#{File.dirname(__FILE__).to_s}/../../config/fluxx_locales/*.{rb,yml}"]
    initializer 'fluxx_engine.add_compass_hooks', :after=> :disable_dependency_loading do |app|
      Sass::Plugin.add_template_location "#{File.dirname(__FILE__).to_s}/../../app/stylesheets", "public/stylesheets/compiled/fluxx_engine"
    end
    rake_tasks do
      load File.expand_path('../../tasks.rb', __FILE__)
    end
  end
end
