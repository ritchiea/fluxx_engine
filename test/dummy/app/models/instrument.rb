class Instrument < ActiveRecord::Base
  belongs_to :locked_by, :class_name => 'Musician', :foreign_key => 'locked_by_id'
  
  insta_search do |insta|
  end
end
