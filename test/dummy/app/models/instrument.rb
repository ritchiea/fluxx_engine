class Instrument < ActiveRecord::Base
  belongs_to :locked_by, :class_name => 'Musician', :foreign_key => 'locked_by_id'
  has_many :musician_instruments
  has_many :musicians, :through => :musician_instruments
  
  insta_search do |insta|
  end
  insta_export do |insta|
  end
  insta_lock do |insta|
  end
end