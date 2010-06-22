class ActionController::ControllerDslCreate < ActionController::ControllerDsl
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
    if @model
      model
    else
      model_class.new(params[model_class.name.underscore.downcase.to_sym])
    end
  end  
  
  def perform_create request, params, model, fluxx_current_user=nil
    post_save_call_proc = self.post_save_call || lambda{|fluxx_current_user, model, params|true}
    
    if model.respond_to?(:created_by_id) && fluxx_current_user
      model.created_by_id = fluxx_current_user.id
    end
    if model.respond_to?(:modified_by_id) && fluxx_current_user
      model.modified_by_id = fluxx_current_user.id
    end
    
    model.save && post_save_call_proc.call(fluxx_current_user, model, params)
    model
  end
end