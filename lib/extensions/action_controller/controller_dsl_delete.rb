class ActionController::ControllerDslDelete < ActionController::ControllerDsl
  # A redirect to issue after a successful completion of the deletion
  attr_accessor :redirect
  
  def load_model params, model
    deleted_at_condition = nil
    deleted_at_condition = 'deleted_at IS NULL' unless really_delete
      
    if model
      model
    else 
      model_class.find(params[:id], :conditions => deleted_at_condition)
    end
  end
  
  
  def perform_delete params, model, fluxx_current_user
    if model.respond_to?(:modified_by_id) && fluxx_current_user
      model.modified_by_id = fluxx_current_user.id
    end
    unless really_delete
      model.deleted_at = Time.now
      model.save(:validate => false)
    else
      model.destroy
    end
    
    model
  end
end