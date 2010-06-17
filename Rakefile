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
    gem.add_dependency('haml', '>= 3')
    gem.add_dependency "agnostic-will_paginate", '>= 3'
    gem.add_development_dependency('jsmin', '>= 1.0.1')
    gem.add_development_dependency('thin', '>= 1.2.7')
  end
rescue
  puts "Jeweler or dependency not available."
end

require 'rake'
require 'rake/rdoctask'
require 'rake/gempackagetask'

require 'rake/testtask'

Rake::TestTask.new(:test) do |t|
  t.libs << 'lib'
  t.libs << 'test'
  t.pattern = 'test/**/*_test.rb'
  t.verbose = false
end

task :default => :test

Rake::RDocTask.new(:rdoc) do |rdoc|
  rdoc.rdoc_dir = 'rdoc'
  rdoc.title    = 'FluxxEngine'
  rdoc.options << '--line-numbers' << '--inline-source'
  rdoc.rdoc_files.include('README.rdoc')
  rdoc.rdoc_files.include('lib/**/*.rb')
end

