require "formtastic" 
require "active_support" 
require "will_paginate" 
require "action_controller"
require "action_view"

# Some classes need to be required before or after; put those in these lists
EXTENSION_CLASSES_TO_PRELOAD = ['extensions/action_controller/controller_dsl', 'extensions/active_record/model_dsl']
EXTENSION_CLASSES_TO_POSTLOAD = ['extensions/action_controller/base', 'extensions/active_record/base']

EXTENSION_CLASSES_TO_NOT_AUTOLOAD = EXTENSION_CLASSES_TO_PRELOAD + EXTENSION_CLASSES_TO_POSTLOAD
EXTENSION_CLASSES_TO_PRELOAD.each do |filename|
  require filename
end
Dir.glob("#{File.dirname(__FILE__).to_s}/extensions/**/*.rb").map{|filename| filename.gsub /\.rb$/, ''}.
  reject{|filename| EXTENSION_CLASSES_TO_NOT_AUTOLOAD.include?(filename) }.each {|filename| require filename }
EXTENSION_CLASSES_TO_POSTLOAD.each do |filename|
  require filename
end

Dir.glob("#{File.dirname(__FILE__).to_s}/fluxx_engine/**/*.rb").each do |fluxx_engine_rb|
  require fluxx_engine_rb.gsub /\.rb$/, ''
end