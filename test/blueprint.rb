include FluxxEngineBlueprint

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