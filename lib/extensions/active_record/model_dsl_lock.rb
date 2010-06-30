class ActiveRecord::ModelDslLock < ActiveRecord::ModelDsl
  def self.lock_time_interval= lock_time_interval_param
    @lock_time_interval = lock_time_interval_param
  end
  
  def self.lock_time_interval
    @lock_time_interval || 5.minutes
  end
  
  def editable? model, fluxx_current_user
    !(model.respond_to?(:locked_until) && model.respond_to?(:locked_by)) || model.locked_until.nil? || model.locked_until < Time.now || 
      (fluxx_current_user != null && model.locked_by == fluxx_current_user)
  end
  
  def add_lock model, fluxx_current_user
    if fluxx_current_user && editable?(model, fluxx_current_user)
      if model.respond_to? :without_delta
        model_class.without_delta do
          add_lock_update_attributes model, fluxx_current_user
        end
      else
        add_lock_update_attributes model, fluxx_current_user
      end
    end
  end
  
  def add_lock_update_attributes model, fluxx_current_user, interval=ActiveRecord::ModelDslLock.lock_time_interval
    if is_lockable?(model)
      if model_class.respond_to? :suspended_delta
        model_class.suspended_delta(false) do
          model.update_attribute :locked_until, Time.now + interval
          model.update_attribute :locked_by_id, fluxx_current_user.id
        end
      else
        model.update_attribute :locked_until, Time.now + interval
        model.update_attribute :locked_by_id, fluxx_current_user.id
      end
    end
  end

  def extend_lock model, fluxx_current_user, extend_interval=ActiveRecord::ModelDslLock.lock_time_interval
    if fluxx_current_user && editable?(model)
      if model.respond_to? :without_delta
        model_class.without_delta do
          extend_lock_update_attributes model, fluxx_current_user, extend_interval
        end
      else
        extend_lock_update_attributes model, fluxx_current_user, extend_interval
      end
    end
  end
  
  # Either extend the current lock by ActiveRecord::ModelDslLock.lock_time_interval minutes or add a lock ActiveRecord::ModelDslLock.lock_time_interval from Time.now
  def extend_lock_update_attributes model, fluxx_current_user, extend_interval=ActiveRecord::ModelDslLock.lock_time_interval
    if is_lockable?(model)
      model = model_class.find model.id
      if model_class.respond_to? :suspended_delta
        model_class.suspended_delta(false) do
          do_lock_update_attributes model, fluxx_current_user, extend_interval
        end
      else
        do_lock_update_attributes model, fluxx_current_user, extend_interval
      end
    end
  end
  
  def do_lock_update_attributes model, fluxx_current_user, extend_interval=ActiveRecord::ModelDslLock.lock_time_interval
    if model.locked_until && model.locked_until > Time.now
      interval = model.locked_until + extend_interval
      model.update_attribute :locked_until, interval
      model.locked_until = interval
    else
      interval = model.locked_until + extend_interval
      model.update_attribute :locked_until, interval
      model.locked_until = interval
    end
    model.update_attribute :locked_by_id, fluxx_current_user.id
    model.locked_by_id = fluxx_current_user.id
    
  end
  
  def remove_lock model, fluxx_current_user
    if editable?(model, fluxx_current_user)
      if model.respond_to? :without_delta
        model_class.without_delta do
          remove_lock_update_attributes model
        end
      else
        remove_lock_update_attributes model
      end
    end
  end
  
  def remove_lock_update_attributes model
    if is_lockable?(model)
      if model_class.respond_to? :suspended_delta
        model_class.suspended_delta(false) do
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