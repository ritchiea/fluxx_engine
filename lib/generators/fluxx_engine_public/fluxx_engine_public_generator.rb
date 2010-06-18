require 'rails/generators'
require 'rails/generators/migration'

class FluxxEnginePublicGenerator < Rails::Generators::Base
  include Rails::Generators::Actions

  def self.source_root
    File.join(File.dirname(__FILE__), 'templates')
  end

  def build_and_copy_fluxx_public_files
    public_dir = File.join(File.dirname(__FILE__), '../../../public')

    run "cd #{public_dir} && rake build"
    
    directory("#{public_dir}/dist", 'public/fluxx_engine/')
    directory("#{public_dir}/theme", 'public/fluxx_engine/')
  end
end
