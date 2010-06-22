class ActionController::ControllerDslAutocomplete < ActionController::ControllerDsl
  attr_accessor :name_fields
  attr_accessor :extra_block
  attr_accessor :extra_conditions
  attr_accessor :order_clause
  attr_accessor :results_per_page
end