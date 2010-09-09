class ActiveRecord::ModelDslLock < ActiveRecord::ModelDsl
  def self.lock_time_interval= lock_time_interval_param
    @lock_time_interval = lock_time_interval_param
  end
  
  def self.lock_time_interval
    @lock_time_interval || 5.minutes
  end
  
  def editable? model, fluxx_current_user
    !(is_lockable?(model)) || model.locked_until.nil? || model.locked_until.to_i < Time.now.to_i || 
      (fluxx_current_user && model.locked_by == fluxx_current_user)
  end
  
  def add_lock model, fluxx_current_user
    if fluxx_current_user && editable?(model, fluxx_current_user)
      add_lock_update_attributes model, fluxx_current_user
      true
    end
  end
  
  def extend_lock model, fluxx_current_user, extend_interval=ActiveRecord::ModelDslLock.lock_time_interval
    if fluxx_current_user && editable?(model, fluxx_current_user)
      extend_lock_update_attributes model, fluxx_current_user, extend_interval
      true
    end
  end

  def remove_lock model, fluxx_current_user
    if editable?(model, fluxx_current_user)
      remove_lock_update_attributes model
      true
    end
  end

  protected
  def add_lock_update_attributes model, fluxx_current_user, interval=ActiveRecord::ModelDslLock.lock_time_interval
    
    if is_lockable?(model)
      p "ESH: 222 about to lock model=#{model.inspect}"
      model.update_attribute_without_log :locked_until, Time.now + interval
      model.update_attribute_without_log :locked_by_id, fluxx_current_user.id
    end
  end
  
  # Either extend the current lock by ActiveRecord::ModelDslLock.lock_time_interval minutes or add a lock ActiveRecord::ModelDslLock.lock_time_interval from Time.now
  def extend_lock_update_attributes model, fluxx_current_user, extend_interval=ActiveRecord::ModelDslLock.lock_time_interval
    if is_lockable?(model)
      p "ESH: 333 about to extend lock model=#{model.inspect}"
      do_lock_update_attributes model, fluxx_current_user, extend_interval
    end
  end
  
  def do_lock_update_attributes model, fluxx_current_user, extend_interval=ActiveRecord::ModelDslLock.lock_time_interval
    if model.locked_until && model.locked_until > Time.now
      interval = model.locked_until + extend_interval
      model.update_attribute_without_log :locked_until, interval
      model.locked_until = interval
    else
      interval = Time.now + extend_interval
      model.update_attribute_without_log :locked_until, interval
      model.locked_until = interval
    end
    model.update_attribute_without_log :locked_by_id, fluxx_current_user.id
    model.locked_by_id = fluxx_current_user.id
    
  end
  
  def remove_lock_update_attributes model
    if is_lockable?(model)
      p "ESH: 444 about remove lock model=#{model.inspect}"
      model.update_attributes_without_log :locked_until => nil, :locked_by => nil
      model.locked_until = nil
      model.locked_by = nil
    end
  end
  
  def is_lockable? model
    model.respond_to?(:locked_until) && model.respond_to?(:locked_by)
  end
end