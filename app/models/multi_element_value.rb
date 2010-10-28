class MultiElementValue < ActiveRecord::Base
  has_many :multi_element_choices
  belongs_to :multi_element_group
  belongs_to :dependent_multi_element_value, :class_name => 'MultiElementValue', :foreign_key => 'dependent_multi_element_value_id'
  
  def to_s
    description || value
  end
end
