class ActionController::ControllerDsl
  # a blob_struct of format blocks broken up by the various names
  attr_accessor :format_block_map
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
  # Do not show related data
  attr_accessor :exclude_related_data
  # Specify the style for this type of card
  attr_accessor :icon_style
  # Don't display flash message
  attr_accessor :dont_display_flash_message

  # Allow you to pass in a block to initialize a new model object
  attr_accessor :new_block
  
  def initialize model_class_param
    self.model_class = model_class_param
    if model_class_param
      self.model_name = model_class.name.underscore.downcase
      @model_human_name = @model_name.gsub('_', ' ').titlecase
      @plural_model_name = @model_name.pluralize
      self.singular_model_instance_name = "@#{@model_name}".to_sym
      self.plural_model_instance_name = "@#{@plural_model_name}".to_sym
    end
    @pre_blocks = []
    @post_blocks = []
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
  
  # Add a block to be executed before the main method
  def pre &block
    @pre_blocks << block
  end
  
  # Add a block to be executed after the action has taken place but before the view has been rendered
  def post &block
    @post_blocks << block
  end
  
  # Add a block to be executed for a particular format block when rendering
  def format &block
    self.format_block_map = BlobStruct.new
    yield format_block_map if block_given?
  end
  
  def invoke_pre controller
    @pre_blocks.each do |pre_block|
      if pre_block && pre_block.is_a?(Proc)
        controller.instance_exec(self, &pre_block)
      end
    end
  end
  
  def invoke_post controller, model, outcome = :success
    @post_blocks.each do |post_block|
      if post_block && post_block.is_a?(Proc)
        controller.instance_exec([self, model, outcome], &post_block)
      end
    end
  end
  
  # Find the path of controllers.  Note that we piggy-back the view_paths, which gives us essentially the same information
  def self.controller_load_path
    ActionController::Base.view_paths.map{|abv| abv.instance_variable_get '@path'}.map{|path| path.gsub /\/app\/views$/, '/app/controllers'}
  end
end