# insta_template do |insta|
#   insta.add_entity :request do |insta_entity|
#     insta_entity.load_entity {|model| model}
#     insta_entity.fields do |insta_field|
#       insta_field.add_methods [:main_org, :primary_org]
#       insta_field.remove_methods [:main_org, :primary_org]
#     end
#   end
#   insta.add_entity :program_organization do |insta_entity|
#     insta_entity.load_entity {|model| model.program_organization}
#     insta_entity.fields do |insta_field|
#       insta_field.add_methods [:main_org, :primary_org]
#       insta_field.remove_methods [:main_org, :primary_org]
#     end
#   end
# end

class ActiveRecord::ModelDslTemplate < ActiveRecord::ModelDsl
  # attributes are the list of fields that should be tracked in the realtime feed
  attr_accessor :delta_attributes
  # the name of the field for modified_by
  attr_accessor :updated_by_field
  # entities representing elements that can be accessed via tokens in a template
  attr_accessor :entities
  
  def initialize
    super
    self.entities = []
  end
  
  def add_entity entity_name, &init_block
    entities
  end
  
end

# By default the Model Template will take an ActiveRecord model and expose all attributes minus id
# You can suppress certain fields from being displayed
# You can also add extra methods that should be available to the template
class ActiveRecord::ModelTemplateEntity
  # name of entity (request/program org, etc.)
  attr_accessor :entity_name
  # extra methods
  attr_accessor :extra_methods
  # do not use methods
  attr_accessor :do_not_use_methods
  
  def initialize name
    self.entity_name = name
    self.extra_methods = []
    self.do_not_use_methods = []
  end
  
  
end