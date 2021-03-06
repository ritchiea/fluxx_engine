class ActionController::ControllerDsl
  # a blob_struct of format blocks broken up by the various names
  attr_accessor :format_block_map
  # Layout to be used
  attr_accessor :layout
  # template to be used
  attr_accessor :template
  # English name of the controller
  attr_accessor :controller_name
  # An array describing the template to display if a given parameter is present
  attr_accessor :template_map
  # view to be used
  attr_accessor :view
  # associated model class
  attr_accessor :model_class
  # associated controller class
  attr_accessor :controller_class
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
  # Specify the style for reports related to this type of card
  attr_accessor :report_icon_style
  # Don't display flash message
  attr_accessor :dont_display_flash_message
  # use redirect not 201
  attr_accessor :use_redirect_not_201
  # Don't show the card footer
  attr_accessor :skip_card_footer
  # Pre-create model
  attr_accessor :pre_create_model
  # Extra action buttons
  attr_accessor :extra_buttons
  # Skip permission check
  attr_accessor :skip_permission_check
  # Show a delete button in the modal
  attr_accessor :allow_delete_from_modal
  # Allow you to pass in a block to initialize a new model object
  attr_accessor :new_block
  # Allow detail area's width to be overriden
  attr_accessor :detail_width
    # Send the list of models to the supplied template and do not try to iterate through in the insta index.html.haml file
  attr_accessor :always_skip_wrapper

  ALL_CONTROLLER_MAPPING = {}
  ALL_TEMPLATE_MAPPING = {}
  
  def layout current_user=nil
    cur_layout = instance_variable_get "@layout"
    if cur_layout.is_a? Proc
      cur_layout.call current_user
    else
      cur_layout
    end
  end
  
  def template= template_name
    instance_variable_set "@template", template_name
    # model_class
    # controller_class
    prefix = controller_class.controller_path
    full_template_name = unless template_name =~ /\//
      "#{prefix}/#{template_name}"
    end || template_name
    form_type = if self.is_a?(ActionController::ControllerDslIndex)
      'list'
    elsif self.is_a?(ActionController::ControllerDslShow)
      'show'
    elsif self.is_a?(ActionController::ControllerDslNew)
      'form'
    elsif self.is_a?(ActionController::ControllerDslEdit)
      'form'
    elsif self.is_a?(ActionController::ControllerDslCreate)
      'form'
    elsif self.is_a?(ActionController::ControllerDslUpdate)
      'form'
    elsif self.is_a?(ActionController::ControllerDslDelete)
      'form'
    end
      
    ALL_TEMPLATE_MAPPING[full_template_name] = {:model_class => self.model_class, :form_type => form_type} if full_template_name && form_type
  end
  
  def self.template_mapping
    ALL_TEMPLATE_MAPPING
  end
  
  def self.map_model_to_controller model_klass, controller_klass
    # register a mapping between model_class and controller_class so we can find out if any controller classes map to the model_class
    mapping = ALL_CONTROLLER_MAPPING[model_klass]
    mapping ||= []
    mapping << controller_klass
    ALL_CONTROLLER_MAPPING[model_klass] = mapping
  end
  
  def self.all_controllers_for_model model_klass
    
    klasses = model_klass.descendant_base_classes.map do |klass|
      ALL_CONTROLLER_MAPPING[klass]
    end
    klasses.compact.flatten.uniq
  end
  
  def initialize model_class_param, controller_class_param
    self.model_class = model_class_param
    self.controller_class = controller_class_param
    ActionController::ControllerDsl.map_model_to_controller model_class_param, controller_class_param
    self.controller_name = controller_class_param.name.gsub(/Controller$/, '').titleize if controller_class_param && controller_class_param.name
    
    
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
  
  
  def load_existing_model params, model=nil, fluxx_current_user=nil
    model = if model
      model
    else 
      model_id = load_param_id params
      model_class.safe_find(model_id, force_load_deleted_param(params)) if model_class && model_id
    end

  end
  
  def load_param_id params
    params.is_a?(Fixnum) ? params : params[:id]
  end
  
  def force_load_deleted_param params
    params[:force_load_deleted] == '1'
  end

  def load_new_model params, model=nil, fluxx_current_user=nil
    retval = if model
      model
    elsif self.new_block && self.new_block.is_a?(Proc)
      self.new_block.call params
    else
      model = model_class.new(params[model_class.name.underscore.downcase.to_sym])
      if pre_create_model && fluxx_current_user
        if model.class.respond_to? :without_realtime
          model.class.without_realtime do
            load_new_model_without_realtime model, fluxx_current_user
          end
        else
          load_new_model_without_realtime model, fluxx_current_user
        end
      end
      model
    end
  end
  
  def load_new_model_without_realtime model, fluxx_current_user
    model.update_attributes({:deleted_at => Time.now, :created_by_id => fluxx_current_user.id})
    model.save(:validate => false)
    model.errors.clear
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
  
  def force_redirect &block
    @force_redirect_block = block
  end

  def has_custom_template controller
    (template_map or {}).keys.map { |key| template_map[key] if controller.params[key] }.compact.first
  end
  
  def template_file controller
    local_template = (template_map or {}).keys.map { |key| template_map[key] if !!controller.params[key] }.compact.first || @template
    local_template && local_template.is_a?(Proc) ? controller.instance_exec(self, &template_file) : local_template
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
  
  def invoke_force_redirect controller
    if @force_redirect_block && @force_redirect_block.is_a?(Proc)
      controller.instance_exec(self, &@force_redirect_block)
    else
      false
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
