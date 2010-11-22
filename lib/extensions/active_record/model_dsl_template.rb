# insta_template do |insta|
#   insta_entity.add_methods [:main_org, :primary_org]
#   insta_entity.add_list_method :request_transactions, RequestTransaction
#   insta_entity.remove_methods [:main_org, :primary_org]
#   insta_entity.load {|model| model}
# end

class ActiveRecord::ModelDslTemplate < ActiveRecord::ModelDsl
  attr_accessor :entity_name
  # extra methods
  attr_accessor :extra_methods
  # extra methods that return a list and can be used with iterators
  attr_accessor :extra_list_methods
  # do not use methods
  attr_accessor :do_not_use_methods
  
  def initialize model_class_param
    super model_class_param
    self.entity_name = model_class_param.name.tableize.singularize.downcase if model_class_param
    self.extra_methods = []
    self.extra_list_methods = []
    self.do_not_use_methods = []

    @method_list = if inherits_from_activerecord?(self.model_class)
      self.model_class.column_names
    else
      self.public_instance_methods
    end
  end
  
  
  def add_methods methods
    self.extra_methods = self.extra_methods + (methods.map{|meth| meth.to_s})
  end

  def add_list_method method, klass
    self.extra_list_methods << [method, klass]
  end
  
  def remove_methods methods
    self.do_not_use_methods = self.do_not_use_methods + (methods.map{|meth| meth.to_s})
  end
  
  def all_methods_allowed model
    if model.instance_of? self.model_class
      string_extra_methods = extra_methods.map {|meth| meth.to_s}
      string_do_not_use_methods = do_not_use_methods.map {|meth| meth.to_s}
      @method_list + string_extra_methods - string_do_not_use_methods
    end || []
  end

  def all_list_methods_allowed model
    if model.instance_of? self.model_class
      extra_list_methods
    end || []
  end

  def method_allowed? model, method_name
    if model.instance_of? self.model_class
      all_methods_allowed(model).include? method_name
    end
  end
  
  
  def list_method_allowed? model, method_name
    if model.instance_of? self.model_class
      extra_list_methods.map{|method_pair| method_pair.first.to_s}.include? method_name
    end
  end
  
  
  def inherits_from_activerecord? klass
    matches = false
    while klass = klass.superclass
      matches = true if klass == ActiveRecord::Base
    end
    matches
  end
  
  def evaluate_model_method model, method_name
    # Allow for dot notation for the method_name, can be:
    # method.method.method, etc.
    methods = method_name.split "."
    method_name = methods.first
    result = model.send(method_name) if method_allowed?(model, method_name)
    if methods.size == 1
      result
    else
      result.evaluate_model_method(methods[1..(methods.size - 1)].join(".")) if result && result.respond_to?(:evaluate_model_method)
    end
  end
  
  def evaluate_model_list_method model, method_name
    model.send(method_name) if list_method_allowed?(model, method_name)
  end
  
  def process_template model, document
    binding = create_bindings model
    c = CurlyParser.new
    doc = c.parse document
    
    sb = evaluate_template model, doc, binding
    sb.string
  end
  
  protected
  
  def create_bindings model
    # build a variable for each entity to create bindings
    binding = ActiveRecord::ModelTemplateBinding.new
    binding.add_binding entity_name, model
    binding
  end

  # This will replace fluxx_iterator, fluxx_conditional, fluxx_value elements within a curly_parser instance
  MAX_DEPTH = 100
  def evaluate_template model, doc, binding, sb = StringIO.new, depth=0
    return sb if depth > MAX_DEPTH
    doc.each do |element|
      if element.element_name == 'iterator'
        iter_map = element.attributes
# {{iterator method='instruments' new_variable='instrument' variable='musician'}}
        variable_name = iter_map['variable']
        new_variable_name = iter_map['new_variable']
        
        list = binding.model_list_evaluate iter_map['variable'], iter_map['method']
        unless list
          raise SyntaxError.new "Could not derive a model from model #{iter_map['variable'].inspect}, bindings=#{binding.inspect} for method #{iter_map['method']}, for element '#{element.inspect}'"
        end

        list.each do |new_model|
          cloned_binding = binding.clone
          cloned_binding.add_binding new_variable_name, new_model
          evaluate_template model, element.children, cloned_binding, sb, depth + 1
        end
      elsif element.element_name == 'value'
        iter_map = element.attributes
        replacement_value = binding.model_evaluate iter_map['variable'], iter_map['method']
        sb << replacement_value
      elsif element.element_name == 'text'
        sb << element.text
      end
    end

    sb
  end
end