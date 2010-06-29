class ActionController::ControllerDsl
  # Layout to be used
  attr_accessor :layout
  # template to be used
  attr_accessor :template
  # view to be used
  attr_accessor :view
  # associated model class
  attr_accessor :model_class
  # internal singular name of mode
  attr_accessor :singular_model_instance_name
  # internal plural name of mode
  attr_accessor :plural_model_instance_name
  # internal name of model
  attr_accessor :model_name

  # Allow you to pass in a block to initialize a new model object
  attr_accessor :new_block
  
  def initialize model_class_param
    self.model_class = model_class_param
    
    self.model_name = model_class.name.underscore.downcase
    @model_human_name = @model_name.gsub('_', ' ').titlecase
    @plural_model_name = @model_name.pluralize
    self.singular_model_instance_name = "@#{@model_name}".to_sym
    self.plural_model_instance_name = "@#{@plural_model_name}".to_sym
  end
  
  def load_existing_model params, model=nil
    model = if model
      model
    else 
      model_id = params.is_a?(Fixnum) ? params : params[:id]
      model_class.safe_find(model_id)
    end
  end
  
  def load_new_model params, model=nil
    if model
      model
    elsif self.new_block && self.new_block.is_a?(Proc)
      self.new_block.call params
    else
      model_class.new(params[model_class.name.underscore.downcase.to_sym])
    end
  end  
  
  def editable? model, fluxx_current_user
    !model.respond_to?(:editable?) || model.editable?(fluxx_current_user)
  end
  
  def extend_lock model, fluxx_current_user, extend_interval
    model.extend_lock(fluxx_current_user, extend_interval) if model.respond_to?(:add_lock)
  end
  
  def add_lock model, fluxx_current_user
    model.add_lock(fluxx_current_user) if model.respond_to?(:add_lock)
  end
  
  def remove_lock model, fluxx_current_user
    model.remove_lock(fluxx_current_user) if model.respond_to?(:remove_lock)
  end
end