class ClientStore < ActiveRecord::Base
  SEARCH_ATTRIBUTES = [:name]
  insta_search do |insta|
    insta.filter_fields = SEARCH_ATTRIBUTES
  end
end