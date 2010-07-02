class Musician < ActiveRecord::Base
  has_many :musician_instruments
  has_many :instruments, :through => :musician_instruments
  
  validates_presence_of     :first_name
  validates_length_of       :first_name,    :within => 3..100
  
  validates_presence_of     :last_name
  validates_length_of       :last_name,    :within => 3..100
  
  insta_search do |insta|
  end
  insta_export do |insta|
  end
  insta_realtime do |insta|
  end
  insta_multi
  insta_utc do |insta|
    insta.time_attributes = [:date_of_birth]
  end

  def to_s
    "#{first_name} #{last_name}"
  end
end
