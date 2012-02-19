
module Liquid
  class Context
    def to_hash
      result_hash = @environments.reverse.inject({}) {|acc, hash| hash.each {|k, v| acc[k] = v}; acc }
      @scopes.reverse.inject(result_hash) {|acc, hash| hash.each {|k, v| acc[k] = v}; acc }
    end
  end
end


class LiquidRenderer
  # Cribbed from action_pack's action_view/helpers.rb
  include ActionView::Helpers::ActiveModelHelper
  include ActionView::Helpers::AssetTagHelper
  include ActionView::Helpers::AtomFeedHelper
  include ActionView::Helpers::CacheHelper
  include ActionView::Helpers::CaptureHelper
  include ActionView::Helpers::CsrfHelper
  include ActionView::Helpers::DateHelper
  include ActionView::Helpers::DebugHelper
  include ActionView::Helpers::FormHelper
  include ActionView::Helpers::FormOptionsHelper
  include ActionView::Helpers::FormTagHelper
  include ActionView::Helpers::JavaScriptHelper
  include ActionView::Helpers::NumberHelper
  include ActionView::Helpers::PrototypeHelper
  include ActionView::Helpers::RawOutputHelper
  include ActionView::Helpers::RecordTagHelper
  include ActionView::Helpers::SanitizeHelper
  include ActionView::Helpers::ScriptaculousHelper
  include ActionView::Helpers::TagHelper
  include ActionView::Helpers::TextHelper
  include ActionView::Helpers::TranslationHelper
  include ActionView::Helpers::UrlHelper
  include ActionDispatch::Routing::UrlFor
  include ActionDispatch::Routing::PolymorphicRoutes
  # include Rails.application.routes.url_helpers

  
  def config
    @config
  end
  def controller
    @config
  end
  
  
  def initialize file
    @initial_file = file
    @initial_file_used = false
    @initial_file_dir = nil
    @paths_to_check = []
    ActionController::Base.view_paths.each {|view_path| @paths_to_check << view_path.instance_variable_get('@path')}
    @config = ActionController::Base
  end
  
  def exists_file? file_name
    if File.exist? file_name
      file_name 
    end
  end
  
  def insert_leading_underscore file_name
    if last_slash_index = file_name.rindex('/')
      "#{file_name[0..last_slash_index]}_#{file_name[last_slash_index+1..(file_name.length)]}"
    else
      "_#{file_name}"
    end
  end
  
  
  def render options
    options = options.stringify_keys
    file_name = options.delete 'partial'
    unless file_name || @initial_file_used
      @initial_file_used = true
      file_name = @initial_file
    end
    local_options = options.delete 'locals'
    options = options.merge(local_options || {})
    underscore_file_name = insert_leading_underscore file_name
    found_file_name = nil
    
    # Grab the first file that matches
    @paths_to_check.each do |view_path|
      unless found_file_name
        found_file_name = exists_file?("#{view_path}/#{underscore_file_name}.html.haml") ||
        exists_file?("#{view_path}/#{underscore_file_name}.haml") ||
        exists_file?("#{view_path}/#{underscore_file_name}") ||
        exists_file?("#{view_path}/#{file_name}") ||
        exists_file?("#{view_path}/#{file_name}.haml") ||
        exists_file?("#{view_path}/#{file_name}.html.haml")
      end
    end
    
    # Include the directory of the first file found because there may be references to other files in the same directory
    if !@initial_file_dir && found_file_name
      @initial_file_dir = File.dirname(found_file_name) 
      @paths_to_check << @initial_file_dir if @initial_file_dir
    end
      
    
    response = nil
    if found_file_name
      template = File.read(found_file_name)
      begin
        response = Haml::Engine.new(template).render(self, options)
      rescue Exception => e
        ActiveRecord::Base.logger.error "LiquidRenderer have exception=#{e.inspect}, #{e.backtrace.inspect}"
      end
      response
    else
      ActiveRecord::Base.logger.error "LiquidExtension: could not find file #{file_name} in #{@paths_to_check.inspect}"
      raise Exception.new "LiquidExtension: could not find file #{file_name} in #{@paths_to_check.inspect}"
    end
    
  end
end


module LiquidFilters
  include ActionView::Helpers::NumberHelper
  include ActionView::Helpers::TextHelper
  
  def format_date(date, format = 'full')
    return nil if date.blank?
    date = date.to_time if date.is_a? String
    date = Time.now if date == 'now'
    date.send(format)
  end
  
  # ex: {{ request_transaction.amount_due | currency: 'Rs. ' }}
  def currency(number, unit='$', delimiter=',', precision=0, format='%u%n')
    return '' unless number
    number = number.to_s.to_d
    return '' if number.blank? || number == 0
    number_to_currency(number, :unit => unit, :delimiter => delimiter, :precision => precision, :format => format)
  end
  
  def comma_join list, delimiter=', '
    if list && list.is_a?(Array)
      list.join(delimiter)
    else
      list
    end
  end
  
  def titlecase(string)
    return nil unless string
    string.titlecase
  end
  
  def capitalize(string)
    return nil unless string
    string.capitalize
  end
  
  def to_english(num)
    return nil unless num
    num.to_english
  end
  
  # provides the ability to assign a value from the result of a filter
  # ex: {{ request.request_reports | sort: 'due_at' | assign_to: 'request_reports' }}
  def assign_to(value, name)
    @context[name] = value ; nil
  end
  
  def to_rtf(string)
    # http://en.wikipedia.org/wiki/Rich_Text_Format#Character_encoding
    # RTF is an 8-bit format. That would limit it to ASCII, but RTF can encode characters beyond ASCII by escape sequences.
    # For a Unicode escape the control word \u is used, followed by a 16-bit signed decimal integer giving the Unicode code point number.
    # ... Until RTF specification version 1.5 release in 1997, RTF has only handled 7-bit characters directly and 8-bit characters encoded as hexadecimal (using \'xx).
    # ... RTF files are usually 7-bit ASCII plain text.
    return nil unless string
    string.gsub!("\n", "\\line\n")
    string.gsub!("\t", "\\tab\t")
    
    # unicode rtf output to covert non-ascii chars: 8-bit to hex, 16-bit to code point
    string.unpack('U*').map { |n| n < 128 ? n.chr : n < 256 ? "\\'#{n.to_s(16)}" : "\\u#{n}\\'3f" }.join('')
  end
  
  def with_line_break(string)
    string.present? ? "#{string}<br/>" : string
  end
  
  def date_add_months(time, number_months=0)
    time + number_months.to_i.months
  end

  def pct(a, b)
    return 0 if b.blank? || b < 1
    "#{(a.to_f / b.to_f * 100).to_i}%"
  end
  
  # NOTE if you have images to render and you run this from a rake task, you have to initialize the current host:
  # FluxxManageHost.current_host
  #
  # Example:
  # FluxxManageHost.current_host = 'http://localhost:3000'
  # ActionController::Base.asset_host will be initialized based on this variable if not already set
  # LiquidFilters
  # document = "Testing: {{controller_template | haml }}"
  # Liquid::Template.parse(document).render('model' => Organization.new(:name => 'ericsorg'), 'controller_template' => 'organizations/_organization_show.html.haml', 'params' => {})
  #  
  def haml file_name
    ActionController::Base.asset_host = FluxxManageHost.current_host unless ActionController::Base.asset_host
    begin
      LiquidRenderer.new(file_name).render(@context.to_hash)
    rescue Exception => e
      ActiveRecord::Base.logger.error "Liquid::haml have error #{e.inspect}, #{e.backtrace.inspect}"
      raise e
    end
  end
  
end


Liquid::Template.register_filter(LiquidFilters)


# TODO ESH: consider making the haml method a tag instead of a filter!!!!  See https://github.com/Shopify/liquid/wiki/Liquid-for-Programmers for details.  Here is an example:
# class Random < Liquid::Tag                                             
#   def initialize(tag_name, max, tokens)
#      super 
#      @max = max.to_i
#   end
# 
#   def render(context)
#     rand(@max).to_s 
#   end    
# end
# 
# Liquid::Template.register_tag('random', Random)
# @template = Liquid::Template.parse(" {% random 5 %}")
# @template.render    # => "3"
