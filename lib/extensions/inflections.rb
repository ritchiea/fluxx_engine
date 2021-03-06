# Be sure to restart your server when you modify this file.

# Add new inflection rules using the following format 
# (all these examples are active by default):
# ActiveSupport::Inflector.inflections do |inflect|
#   inflect.plural /^(ox)$/i, '\1en'
#   inflect.singular /^(ox)en/i, '\1'
#   inflect.irregular 'person', 'people'
#   inflect.uncountable %w( fish sheep )
# end

module ActiveSupport::Inflector
  # does the opposite of humanize.... mostly. Basically does a
  # space-substituting .underscore
  def dehumanize(the_string)
    result = the_string.to_s.dup
    result.downcase.gsub(/ +/,'_')
  end
end
class String
  def dehumanize
    ActiveSupport::Inflector.dehumanize(self)
  end
  
  def de_json
    ActiveSupport::JSON.decode self # try to deserialize the JSON
  end
  
  def de_yaml
    YAML::load self # try to deserialize the YAML
  end
  
  def is_numeric?
    /^[\d]*$/ === self.strip
  end
  
  def methodize
    name = self.downcase.gsub(/\s+/, '_').gsub(/\W/, '').gsub(/_+/,'_').gsub(/[^0-9A-Za-z_]/, '').gsub(/__/, '').gsub(/_$/, '')
    name = "a#{name}" if name =~ /^\d/
    name
  end

  def cssize
    name = self.gsub(/[^0-9px%]/, '')
    "#{name.to_i}#{(name =~/\%$/ ? '%' : 'px')}"
  end
end
