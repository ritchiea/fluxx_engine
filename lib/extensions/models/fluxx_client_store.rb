module FluxxClientStore
  extend FluxxModuleHelper

  SEARCH_ATTRIBUTES = [:name, :client_store_type]

  when_included do
    insta_search do |insta|
      insta.filter_fields = SEARCH_ATTRIBUTES
    end

    validates_presence_of :name
    acts_as_audited({:full_model_enabled => false, :except => [:created_by_id, :modified_by_id, :locked_until, :locked_by_id, :delta, :updated_by, :created_by, :audits]})
  end
  
  class_methods do
    def dashboard_card_params json_card
      if json_card['listing']['data']
        json_card['listing']['data'].inject({}) do |acc, name_value|
          acc[name_value['name']] = name_value['value']
          acc
        end.reject{|k, v| v.blank? || k.blank? || k == 'utf8'}
      end || []
    end
  end
  
  instance_methods do
    def dashboard_cards
      funj = self.data.de_json
      if funj
        funj['cards']
      else
        []
      end
    end
    
    
    def as_dashboard
      cards = []
      dashboard_cards.each do |card|
        title = card['title']
        url = card['listing']['url']
        uid = card['uid']
        filters = dashboard_card_params json_card
        cards << {:uid => uid, :title => title, :url => url, :filters => filters}
      end
      [:id => self.id, :name => self.name, :cards => cards]
    end
  end
end