class ClientStore < ActiveRecord::Base
  SEARCH_ATTRIBUTES = [:name, :client_store_type]
  insta_search do |insta|
    insta.filter_fields = SEARCH_ATTRIBUTES
  end
  validates_presence_of     :name
  acts_as_audited({:full_model_enabled => false, :except => [:created_by_id, :modified_by_id, :locked_until, :locked_by_id, :delta, :updated_by, :created_by, :audits]})
  
  def as_dashboard
    funj = self.data.de_json
    cards = []
    funj['cards'].each do |card|
      title = card['title']
      url = card['listing']['url']
      filters = card['listing']['data'].inject({}) do |acc, name_value|
        acc[name_value['name']] = name_value['value']
        acc
      end.reject{|k, v| v.blank? || k.blank? || k == 'utf8'}
      
      cards << {:title => title, :url => url, :filters => filters}
    end
    cards
  end
end