class ActionController::ControllerDslDelete < ActionController::ControllerDsl
  attr_accessor :redirect
  
  def load_model request, params, model
    deleted_at_condition = nil
    deleted_at_condition = 'deleted_at IS NULL' unless really_delete
      
    if model
      model
    else 
      model_class.find(params[:id], :conditions => deleted_at_condition)
    end
  end
  
  
  def perform_delete request, params, model, fluxx_current_user
    if model.respond_to?(:modified_by_id) && fluxx_current_user
      model.modified_by_id = fluxx_current_user.id
    end
    unless really_delete
      model.deleted_at = Time.now
      model.save_without_validation
    else
      model.destroy
    end
    
    model
  end
end