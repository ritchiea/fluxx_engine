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
  street_address Sham.word
  city Sham.word
  state Sham.word
  zip Sham.word
  date_of_birth Time.now
end

Instrument.blueprint do
  name Sham.word
  price rand(100000)
  date_of_birth Time.now
end

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

Orchestra.blueprint do
end

ClientStore.blueprint do
  name Sham.word
  client_store_type Sham.word
end

User.blueprint do
  email Sham.email
  first_name Sham.first_name
  last_name Sham.last_name
end

MusicianInstrument.blueprint do
end