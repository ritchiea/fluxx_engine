class ActionController::ControllerDslUpdate < ActionController::ControllerDsl
# GETTERS/SETTERS stored here:
  attr_accessor :link_to_method
  # A message to send back after a successful completion of the creation
  attr_accessor :render_inline
  # A redirect to issue after a successful completion of the creation
  attr_accessor :redirect
  # add a class to the form element
  attr_accessor :form_class
  # specify the URL for the form
  attr_accessor :form_url

# ACTUALLY USED IN THIS CLASS
  # A call to make after the save occurs
  attr_accessor :post_save_call
  
  def perform_update params, model, fluxx_current_user=nil
    post_save_call_proc = self.post_save_call || lambda{|fluxx_current_user, model, params|true}
    modified_by_map = {}
    if model.respond_to?(:modified_by_id) && fluxx_current_user
      modified_by_map[:modified_by_id] = fluxx_current_user.id
    end
    if editable?(model, fluxx_current_user) && model.update_attributes(modified_by_map.merge(params[model_class.name.underscore.downcase.to_sym] || {})) && post_save_call_proc.call(fluxx_current_user, model, params)
      remove_lock model, fluxx_current_user
    else
      add_lock model, fluxx_current_user
    end
    
  end
end