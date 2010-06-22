class ActionController::ControllerDslNew < ActionController::ControllerDsl
  # Allow you to pass in a block to initialize a new model object
  attr_accessor :new_block
  attr_accessor :button_definition
  attr_accessor :button_verb
  # add a class to the form element
  attr_accessor :form_class
  # specify the URL for the form
  attr_accessor :form_url
  
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