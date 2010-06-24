class ActionController::ControllerDsl
  # Layout to be used
  attr_accessor :layout
  # template to be used
  attr_accessor :template
  # view to be used
  attr_accessor :view
  # view to be used
  attr_accessor :really_delete
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
    self.really_delete = !(model_class.columns.map(&:name).include? 'deleted_at') if self.really_delete.blank?
    
    self.model_name = model_class.name.underscore.downcase
    @model_human_name = @model_name.gsub('_', ' ').titlecase
    @plural_model_name = @model_name.pluralize
    self.singular_model_instance_name = "@#{@model_name}".to_sym
    self.plural_model_instance_name = "@#{@plural_model_name}".to_sym
  end
  
  def load_existing_model params, model=nil
    update_condition = nil
    update_condition = 'deleted_at IS NULL' unless really_delete
    model = if model
      model
    else 
      model_id = params.is_a?(Fixnum) ? params : params[:id]
      model_class.find(model_id, :conditions => update_condition)
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
  
  
  
  
  ########################
  # TODO ESH: look at moving the locking functionality to an external active_record module; doesn't really belong here
  ########################
  
  ## Use ActionController::ControllerDsl.lock_time_interval= to set a different value
  def self.lock_time_interval= lock_time_interval_param
    @lock_time_interval = lock_time_interval_param
  end
  
  def self.lock_time_interval
    @lock_time_interval || 5.minutes
  end
  
  def editable? model, fluxx_current_user
    !(@model.respond_to?(:locked_until) && @model.respond_to?(:locked_by)) || @model.locked_until.nil? || @model.locked_until < Time.now || 
      (fluxx_current_user != null && @model.locked_by == fluxx_current_user)
  end
  
  def add_lock model, fluxx_current_user
    if fluxx_current_user && editable?(model, fluxx_current_user)
      if model.respond_to? :without_delta
        model.class.without_delta do
          add_lock_update_attributes model, fluxx_current_user
        end
      else
        add_lock_update_attributes model, fluxx_current_user
      end
    end
  end
  
  def add_lock_update_attributes model, fluxx_current_user
    if is_lockable?(model)
      if model.class.respond_to? :suspended_delta
        model.class.suspended_delta(false) do
          model.update_attribute :locked_until, Time.now + ActionController::ControllerDsl.lock_time_interval
          model.update_attribute :locked_by_id, fluxx_current_user.id
        end
      else
        model.update_attribute :locked_until, Time.now + ActionController::ControllerDsl.lock_time_interval
        model.update_attribute :locked_by_id, fluxx_current_user.id
      end
    end
  end

  def extend_lock model, fluxx_current_user
    if fluxx_current_user && editable?(model)
      if model.respond_to? :without_delta
        model.class.without_delta do
          extend_lock_update_attributes model, fluxx_current_user
        end
      else
        extend_lock_update_attributes model, fluxx_current_user
      end
    end
  end
  
  # Either extend the current lock by ActionController::ControllerDsl.lock_time_interval minutes or add a lock ActionController::ControllerDsl.lock_time_interval from Time.now
  def extend_lock_update_attributes model, fluxx_current_user
    if is_lockable?(model)
      model = model.class.find model.id
      if model.class.respond_to? :suspended_delta
        model.class.suspended_delta(false) do
          do_lock_update_attributes model, fluxx_current_user
        end
      else
        do_lock_update_attributes model, fluxx_current_user
      end
    end
  end
  
  def do_lock_update_attributes model, fluxx_current_user
    if model.locked_until && model.locked_until > Time.now
      interval = model.locked_until + ActionController::ControllerDsl.lock_time_interval
      model.update_attribute :locked_until, interval
      model.locked_until = interval
    else
      interval = model.locked_until + ActionController::ControllerDsl.lock_time_interval
      model.update_attribute :locked_until, interval
      model.locked_until = interval
    end
    model.update_attribute :locked_by_id, fluxx_current_user.id
    model.locked_by_id = fluxx_current_user.id
    
  end
  
  def remove_lock model, fluxx_current_user
    if editable?(model, fluxx_current_user)
      if model.respond_to? :without_delta
        model.class.without_delta do
          remove_lock_update_attributes model
        end
      else
        remove_lock_update_attributes model
      end
    end
  end
  
  def remove_lock_update_attributes model
    if is_lockable?(model)
      if model.class.respond_to? :suspended_delta
        model.class.suspended_delta(false) do
          model.update_attributes :locked_until => nil, :locked_by => nil
          model.locked_until = nil
          model.locked_by = nil
        end
      else
        model.update_attributes :locked_until => nil, :locked_by => nil
        model.locked_until = nil
        model.locked_by = nil
      end
    end
  end
  
  def is_lockable? model
    model.respond_to?(:locked_until) && model.respond_to?(:locked_by)
  end
  
end