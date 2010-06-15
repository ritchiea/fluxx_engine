begin
  require "jeweler"
  Jeweler::Tasks.new do |gem|
    gem.name = "fluxx_engine"
    gem.summary = "Fluxx Engine"
    gem.email = "fluxx@acesfconsulting.com"
    gem.authors = ["Eric Hansen"]
    gem.files = Dir["{lib}/**/*", "{app}/**/*", "{config}/**/*"]
    gem.add_dependency('fastercsv', '>= 1.5.3')
    gem.add_dependency('formtastic-rails3', '>= 0.9.10.0')
# TODO ESH: add in the 3 version when available
#    gem.add_dependency('will_paginate', '>= 2.3.14')

    # http://github.com/rgrove/jsmin/
    gem.add_development_dependency('jsmin', '>= 1.0.1')
  end
rescue
  puts "Jeweler or dependency not available."
end
