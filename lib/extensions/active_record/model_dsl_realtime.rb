class ActiveRecord::ModelDslRealtime < ActiveRecord::ModelDsl
  # attributes are the list of fields that should be tracked in the realtime feed
  attr_accessor :delta_attributes
  # the name of the field for modified_by
  attr_accessor :updated_by_field
  
  def calculate_attributes model
    if delta_attributes
      delta_attributes.inject({}) do |acc, attribute|
        acc[attribute] = model.send(attribute)
        acc
      end
    end
  end
  
  def realtime_user_id model
    model.send(updated_by_field) if updated_by_field
  end
  
  def realtime_model_id model
    if model.respond_to? :realtime_update_id
      model.realtime_update_id
    else
      model.id
    end
  end
  
  def realtime_create_callback model
    write_realtime(model, :action => 'create', :user_id => realtime_user_id(model), :model_id => realtime_model_id(model), :model_class => model.class.name, :type_name => model.class.name, :delta_attributes => calculate_attributes(model).to_json)
  end
  
  def realtime_update_callback model
    if model.respond_to?(:deleted_at) && !model.deleted_at.blank?
      realtime_destroy_callback model
    else
      write_realtime(model, :action => 'update', :user_id => realtime_user_id(model), :model_id => realtime_model_id(model), :model_class => model.class.name, :type_name => model.class.name, :delta_attributes => calculate_attributes(model).to_json)
    end
  end
  
  def realtime_destroy_callback model
    write_realtime(model, :action => 'delete', :user_id => realtime_user_id(model), :model_id => realtime_model_id(model), :model_class => model.class.name, :type_name => model.class.name, :delta_attributes => calculate_attributes(model).to_json)
  end
  
  def write_realtime  model, params
    RealtimeUpdate.create params 
  end
end