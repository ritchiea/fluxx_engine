class ClientStore < ActiveRecord::Base
  SEARCH_ATTRIBUTES = [:name, :client_store_type]
  insta_search do |insta|
    insta.filter_fields = SEARCH_ATTRIBUTES
  end
  validates_presence_of     :name
end