# Configure Rails Envinronment
ENV["RAILS_ENV"] = "test"


require File.expand_path("../dummy/config/environment.rb",  __FILE__)
require File.join(File.dirname(__FILE__), 'blueprint')

require "rails/test_help"

ActionMailer::Base.delivery_method = :test
ActionMailer::Base.perform_deliveries = true
ActionMailer::Base.default_url_options[:host] = "test.com"

Rails.backtrace_cleaner.remove_silencers!

# Configure capybara for integration testing
require "capybara/rails"
Capybara.default_driver   = :rack_test
Capybara.default_selector = :css

# Run any available migration
ActiveRecord::Migrator.migrate File.expand_path("../dummy/db/migrate/", __FILE__)

# Load support files
Dir["#{File.dirname(__FILE__)}/support/**/*.rb"].each { |f| require f }

class SimpleFormat
  attr_accessor :csv
  attr_accessor :xls
  attr_accessor :json
  
  def initialize csv_param=nil, xls_param=nil, json_param=nil
    self.csv = csv_param
    self.xls = xls_param
    self.json = json_param
  end
  
  def csv?
    csv
  end
  def xls?
    xls
  end
end