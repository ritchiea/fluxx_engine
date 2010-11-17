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
  

end