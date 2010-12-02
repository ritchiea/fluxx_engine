class MultiElementGroup < ActiveRecord::Base
  has_many :multi_element_values
  
  # Allow for STI; look for the specific name first, then bump up to the superclass; we might call it Request for GrantRequest/FipRequest.  First look for GrantRequest then Request
  def self.find_for_model_or_super model, name
    klass = if model.is_a? Class
      model
    else
      model.class
    end
    group = nil
    while klass && !group
      group = MultiElementGroup.find :first, :conditions => {:name => name, :target_class_name => klass.name}
      klass = klass.superclass
      klass = nil if klass == ActiveRecord::Base
    end
    group
  end
  
end
