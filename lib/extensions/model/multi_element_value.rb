class MultiElementValue < ActiveRecord::Base
  has_many :multi_element_choices
  
  def to_s
    description || value
  end
end
