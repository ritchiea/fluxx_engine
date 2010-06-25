require "formtastic" 
require "active_support" 
require "will_paginate" 
require "action_controller"
require "action_view"

Dir.glob("#{File.dirname(__FILE__).to_s}/extensions/**/*.rb").sort.each do |extension_rb|
  require extension_rb.gsub /\.rb$/, ''
end

Dir.glob("#{File.dirname(__FILE__).to_s}/fluxx_engine/**/*.rb").each do |fluxx_engine_rb|
  require fluxx_engine_rb.gsub /\.rb$/, ''
end
