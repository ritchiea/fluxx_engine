class ActionController::ControllerDslAutocomplete < ActionController::ControllerDsl
  # fields used for the name
  attr_accessor :name_fields
  # 
  attr_accessor :extra_block
  # 
  attr_accessor :extra_conditions
  # order by clause
  attr_accessor :order_clause
  # number of results desired per page
  attr_accessor :results_per_page
end