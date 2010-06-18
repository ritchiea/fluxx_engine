require 'machinist/active_record'
require 'sham'

require 'faker'

ATTRIBUTES = {}

def bp_attrs
  ATTRIBUTES
end

# For faker formats see http://faker.rubyforge.org/rdoc/

Sham.word { Faker::Lorem.words(2).join '' }
Sham.sentence { Faker::Lorem.sentence }
Sham.company_name { Faker::Company.name }
Sham.first_name { Faker::Name.first_name }
Sham.last_name { Faker::Name.last_name }
Sham.login { Faker::Internet.user_name }
Sham.email { Faker::Internet.email }
Sham.url { "http://#{Faker::Internet.domain_name}/#{Faker::Lorem.words(1).first}"  }

Musician.blueprint do
  first_name Sham.first_name
  last_name Sham.last_name
end