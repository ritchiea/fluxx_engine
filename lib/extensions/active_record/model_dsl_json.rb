# JSON records can be derived from the set of attributes in a model object based on the following markup
#  * only: a list of attributes that should be displayed to the exclusion of any others
#  * except: all attributes should be returned *except* for these
#  * method: a list of methods that should be invoked
# Note that any associated methods that are JSON-ified will use :simple style.  
class ActiveRecord::ModelDslJson < ActiveRecord::ModelDsl
  # List of attributes that should use amount
  attr_accessor :settings
  
  def generate_method_settings
    ['detail_url', 'id', 'class_name']
  end
  
  def generate_settings
    {:method => generate_method_settings, :only => [], :except => []}
  end
  
  ALLOWED_STYLES=[:simple, :detailed]

  def initialize model_class_param
    super model_class_param
    self.settings = {}
    ALLOWED_STYLES.each do |style|
      self.settings[style] = generate_settings
    end
  end
  
  def clear_only style=:simple
    raise Exception.new "Style #{style} is not allowed" unless ALLOWED_STYLES.include? style
    settings[style][:only].clear
  end
  
  def add_only name, style=:simple
    raise Exception.new "Style #{style} is not allowed" unless ALLOWED_STYLES.include? style
    settings[style][:only] << name.to_s
  end
  
  def clear_except style=:simple
    raise Exception.new "Style #{style} is not allowed" unless ALLOWED_STYLES.include? style
    settings[style][:except].clear
  end

  def add_except name, style=:simple
    raise Exception.new "Style #{style} is not allowed" unless ALLOWED_STYLES.include? style
    settings[style][:except] << name.to_s
  end
  
  def clear_method style=:simple
    raise Exception.new "Style #{style} is not allowed" unless ALLOWED_STYLES.include? style
    settings[style][:method].clear
    settings[style][:method] = generate_method_settings
  end

  def add_method name, style=:simple
    raise Exception.new "Style #{style} is not allowed" unless ALLOWED_STYLES.include? style
    settings[style][:method] << name.to_s
  end
  
  def copy_style from_style, to_style
    raise Exception.new "From Style #{from_style} is not allowed" unless ALLOWED_STYLES.include? from_style
    raise Exception.new "To Style #{to_style} is not allowed" unless ALLOWED_STYLES.include? to_style
    
    settings[from_style].keys do |k|
      settings[to_style][k] = settings[from_style][k].clone
    end
    
    # We don't want to add the :only clause if it's detailed style
    clear_only :detailed if to_style == :detailed
  end
  
  def calculate_json_options orig_options={}
    options = (orig_options || {}).clone
    option_methods = options[:methods] || []
    option_only = options[:only] || []
    option_except = options[:except] || []
    style = options[:fluxx_render_style] || :simple
    style = :simple unless ALLOWED_STYLES.include? style

    p "ESH: in calculate json options whoo hoo!!!  style=#{style}"
    if style
      option_methods += settings[style][:method]
      option_only += settings[style][:only]
      option_except += settings[style][:except]
    end
    
    retval = options.merge({:methods => option_methods, :only => option_only, :except => option_except})
    p "ESH: 444 retval=#{retval.inspect}"
    retval
  end
end