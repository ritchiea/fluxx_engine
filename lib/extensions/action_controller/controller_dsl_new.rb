class ActionController::ControllerDslNew < ActionController::ControllerDsl
  attr_accessor :new_block
  attr_accessor :multi_part
  attr_accessor :form_class
  attr_accessor :form_name
  attr_accessor :button_definition
  attr_accessor :button_verb
  
  def perform_new request, params, model=nil
    if model
      model
    elsif self.new_block && self.new_block.is_a?(Proc)
      self.new_block.call params
    else
      model_class.new
    end
  end
end