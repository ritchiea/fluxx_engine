class Instrument < ActiveRecord::Base
  belongs_to :locked_by, :class_name => 'Musician', :foreign_key => 'locked_by_id'
  has_many :musician_instruments
  has_many :musicians, :through => :musician_instruments
  acts_as_audited({:full_model_enabled => true, :except => [:created_at, :updated_at], :except => [:created_at, :updated_at, :locked_until, :locked_by_id, :deleted_at, :created_by_id, :updated_by_id]})
  
  
  insta_search do |insta|
    insta.filter_fields = [:created_at, :name, :id]
  end
  insta_export do |insta|
  end
  insta_lock do |insta|
  end
  insta_multi
  
  def to_s
    name
  end
end