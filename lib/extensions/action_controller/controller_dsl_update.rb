class ActionController::ControllerDslUpdate < ActionController::ControllerDsl
  # Name to go on submit button
  attr_accessor :button_definition
  # Verb to go on submit button (create/update)
  attr_accessor :button_verb
  # 
  attr_accessor :link_to_method
  # A call to make after the save occurs
  attr_accessor :post_save_call
  # A message to send back after a successful completion of the creation
  attr_accessor :render_inline
  # A redirect to issue after a successful completion of the creation
  attr_accessor :redirect
  # add a class to the form element
  attr_accessor :form_class
  # specify the URL for the form
  attr_accessor :form_url
  
  
  def load_model request, params, model
    update_condition = nil
    update_condition = 'deleted_at IS NULL' unless really_delete
    model = if model
      model
    else 
      model_class.find(params[:id], :conditions => update_condition)
    end
  end
  
  def perform_update request, params, model, fluxx_current_user=nil
    post_save_call_proc = self.post_save_call || lambda{|fluxx_current_user, model, params|true}
    modified_by_map = {}
    if model.respond_to?(:modified_by_id) && fluxx_current_user
      modified_by_map[:modified_by_id] = fluxx_current_user.id
    end
    if editable?(model) && model.update_attributes(modified_by_map.merge(params[model_class.name.underscore.downcase.to_sym] || {})) && post_save_call_proc.call(fluxx_current_user, model, params)
      remove_lock model
    else
      add_lock model
    end
    
  end
end