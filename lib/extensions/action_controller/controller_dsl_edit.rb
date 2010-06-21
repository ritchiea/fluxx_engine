class ActionController::ControllerDslEdit < ActionController::ControllerDsl
  attr_accessor :form_name
  attr_accessor :button_definition
  attr_accessor :button_verb
  attr_accessor :form_url
  
  def perform_edit request, params, model
    edit_condition = nil
    edit_condition = 'deleted_at IS NULL' unless really_delete
    
    model = if model
      model
    else
      instance_variable_set @singular_model_instance_name, model_class.find(params[:id], :conditions => edit_condition)
    end
    if editable? model
      add_lock model
    end
    model
  end
end