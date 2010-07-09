class MultiElementValue < ActiveRecord::Base
  has_many :multi_element_choices
  belongs_to :multi_element_group
  
  def to_s
    description || value
  end
end
