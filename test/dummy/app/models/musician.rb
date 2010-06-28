class Musician < ActiveRecord::Base
  has_many :musician_instruments
  has_many :instruments, :through => :musician_instruments
  
  insta_search do |insta|
  end
  insta_export do |insta|
  end

  def to_s
    "#{first_name} #{last_name}"
  end
end
