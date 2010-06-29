class ActiveRecord::ModelDslRealtime < ActiveRecord::ModelDsl
  # attributes are the list of fields that should be tracked in the realtime feed
  attr_accessor :delta_attributes
  # the name of the field for modified_by
  attr_accessor :modified_by_field
  # Name of the type of class represented by this update; usually the class name.  
  # Note that this name may differ based on the properties of the object (flags might change the properties and thus the way the update should be handled or differing classes
  # might need to be handled as the parent type), so a block may be substituted for a string
  attr_accessor :type_name
  # If this is true, the realtime updates will not execute
  attr_accessor :realtime_disabled
  
  def calculate_attributes model
    if delta_attributes
      delta_attributes.inject({}) do |acc, attribute|
        acc[attribute] = model.send(attribute)
        acc
      end
    end
  end
  
  def calculate_type model
    if type_name.is_a? Proc
      type_name.call model
    elsif type_name
      type_name.to_s
    else
      model.class.name
    end
  end
  
  def realtime_user_id model
    model.send(modified_by_field) if modified_by_field
  end
  
  def realtime_create_callback model
    write_realtime(model, :action => 'create', :user_id => realtime_user_id(model), :model_id => model.id, :model_class => model.class.name, :type_name => calculate_type(model), :delta_attributes => calculate_attributes(model).to_json) unless realtime_disabled
  end
  
  def realtime_update_callback model
    if model.respond_to?(:deleted_at) && !model.deleted_at.blank?
      realtime_destroy_callback
    else
      write_realtime(model, :action => 'update', :user_id => realtime_user_id(model), :model_id => model.id, :model_class => model.class.name, :type_name => calculate_type(model), :delta_attributes => calculate_attributes(model).to_json) unless realtime_disabled
    end
  end
  
  def realtime_destroy_callback model
    write_realtime(model, :action => 'delete', :user_id => realtime_user_id(model), :model_id => model.id, :model_class => model.class.name, :type_name => calculate_type(model), :delta_attributes => calculate_attributes(model).to_json) unless realtime_disabled
  end
  
  def write_realtime  model, params
    RealtimeUpdate.create params unless realtime_disabled
  end
end