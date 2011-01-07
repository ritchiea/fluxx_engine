require 'machinist/active_record'
require 'sham'

require 'faker'

module FluxxEngineBlueprint
ATTRIBUTES = {}

  def self.included(base)
    # For faker formats see http://faker.rubyforge.org/rdoc/

    Sham.word { Faker::Lorem.words(2).join '' }
    Sham.sentence { Faker::Lorem.sentence }
    Sham.company_name { Faker::Company.name }
    Sham.first_name { Faker::Name.first_name }
    Sham.last_name { Faker::Name.last_name }
    Sham.login { Faker::Internet.user_name }
    Sham.email { Faker::Internet.email }
    Sham.url { "http://#{Faker::Internet.domain_name}/#{Faker::Lorem.words(1).first}"  }
  
    RealtimeUpdate.blueprint do
      action 'create'
      model_id 1
      type_name 'Musician'
      model_class 'Musician'
      delta_attributes ''
    end

    MultiElementGroup.blueprint do
    end
    MultiElementValue.blueprint do
    end
    ClientStore.blueprint do
      name Sham.word
      client_store_type Sham.word
    end
  
    base.extend(ModelClassMethods)
    base.class_eval do
      include ModelInstanceMethods
    end
  end

  module ModelClassMethods
  end
  
  module ModelInstanceMethods
    def bp_attrs
      ATTRIBUTES
    end
  end
end