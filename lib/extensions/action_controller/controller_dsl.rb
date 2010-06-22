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
  
  def initialize model_class_param
    self.model_class = model_class_param
    self.really_delete = !(model_class.columns.map(&:name).include? 'deleted_at') if self.really_delete.blank?
    
    self.model_name = model_class.name.underscore.downcase
    @model_human_name = @model_name.gsub('_', ' ').titlecase
    @plural_model_name = @model_name.pluralize
    self.singular_model_instance_name = "@#{@model_name}".to_sym
    self.plural_model_instance_name = "@#{@plural_model_name}".to_sym
  end
  
  def editable? model
    !(@model.respond_to?(:locked_until) && @model.respond_to?(:locked_by)) || @model.locked_until.nil? || @model.locked_until < Time.now || @model.locked_by == fluxx_current_user
  end
  
  def add_lock model
    if editable?(model)
      if model.respond_to? :without_delta
        model.class.without_delta do
          add_lock_update_attributes model
        end
      else
        add_lock_update_attributes model
      end
    end
  end
  
  def add_lock_update_attributes model
    if is_lockable?(model)
      model = model.class.find model.id
      model.class.suspended_delta(false) do
        model.update_attribute :locked_until, Time.now + LOCK_TIME_INTERVAL
        model.update_attribute :locked_by_id, fluxx_current_user.id
      end
    end
  end

  def extend_lock model
    if editable?(model)
      if model.respond_to? :without_delta
        model.class.without_delta do
          extend_lock_update_attributes model
        end
      else
        extend_lock_update_attributes model
      end
    end
  end
  
  # Either extend the current lock by LOCK_TIME_INTERVAL minutes or add a lock LOCK_TIME_INTERVAL from Time.now
  def extend_lock_update_attributes model
    if is_lockable?(model)
      model = model.class.find model.id
      model.class.suspended_delta(false) do
        if model.locked_until && model.locked_until > Time.now
          interval = model.locked_until + LOCK_TIME_INTERVAL
          model.update_attribute :locked_until, interval
          model.locked_until = interval
        else
          interval = model.locked_until + LOCK_TIME_INTERVAL
          model.update_attribute :locked_until, interval
          model.locked_until = interval
        end
        model.update_attribute :locked_by_id, fluxx_current_user.id
        model.locked_by_id = fluxx_current_user.id
      end
    end
  end
  
  def remove_lock model
    if editable?(model)
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
      model.class.suspended_delta(false) do
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