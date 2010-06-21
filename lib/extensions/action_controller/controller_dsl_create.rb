class ActionController::ControllerDslCreate < ActionController::ControllerDsl
  attr_accessor :form_name
  attr_accessor :button_definition
  attr_accessor :button_verb
  attr_accessor :link_to_method
  attr_accessor :post_save_call
  attr_accessor :render_inline
  attr_accessor :controller
  attr_accessor :redirect

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