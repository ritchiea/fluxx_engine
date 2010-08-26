# This allows users to express relations between objects and how they should be displayed.
# Among models, there are always objects that they have relationships with.  For example, workers work at companies,
# so if viewing a company page, there should be an easy way to jump to the list of workers at that particular company.
# To do this, a filter must be specified to limit the workers that are related to that company.
class ActionController::ControllerDslRelated < ActionController::ControllerDsl
# GETTERS/SETTERS stored here:
  # An ordered list of relations of this model to other model objects
  attr_accessor :relations
  # An ordered list of relations of this model to other model objects expressed in blocks
  attr_accessor :block_relations

  # Sample usage o the add_related method
  # insta_related do |related_insta|
  #   insta.add_related do |block_insta|
  #     block_insta.add_related do |insta|
  #       insta.display_name = "People"
  #       insta.related_class = User
  #       insta.search_id = [:request_ids, :user_request_ids]
  #       insta.extra_condition = {:deleted_at => 0}
  #       insta.order = 'last_name asc, first_name asc'
  #       insta.display_template = '/users/related_users'
  #     end
  #   end
  # end
  def add_related
    relationship = ActionController::ModelRelationship.new
    yield relationship if block_given?
    self.relations = [] unless relations && relations.is_a?(Array)
    relations << relationship
  end
  
  # block relations are evaluated at runtime
  # Sample usage of the add_related block
  # insta_related do |related_insta|
  #   insta.add_related_block do |block_insta, model|
  #     if model.granted
  #       block_insta.add_related do |insta|
  #         insta.display_name = "People"
  #         insta.related_class = User
  #         insta.search_id = [:request_ids, :user_request_ids]
  #         insta.extra_condition = {:deleted_at => 0}
  #         insta.order = 'last_name asc, first_name asc'
  #         insta.display_template = '/users/related_users'
  #       end
  #     end
  #   end
  # end
  def add_related_block &block_relation
    self.block_relations = [] unless block_relations && block_relations.is_a?(Array)
    self.block_relations << block_relation
  end
  
  # Returns an array of formatted data per related class
  def load_related_data model
    model_relations = []
    
    if relations && !relations.empty?
      model_relations = model_relations + relations
    end
    if block_relations && !block_relations.empty?
      block_relations_results = block_relations.map do |br| 
        relationship = ModelRelationship.new
        br.call relationship, model
        model_relations << relationship
      end
    end
    
    model_relations.map do |rd|
      formatted_data = if rd.search_id && rd.search_id.is_a?(Array)
        results = rd.search_id.map do |search_id|
          calculate_related_data_row model, rd, search_id
        end.compact.flatten
        results
      else
        calculate_related_data_row model, rd, rd.search_id
      end
      {:formatted_data => formatted_data, :display_name => rd.display_name}
    end
  end
  
  def calculate_related_data_row model, rd, search_id
    klass = rd.related_class
    display_template = rd.display_template
    max_results = rd.max_results || 50
    order_clause = rd.order || ''
    order_clause = 'id desc' if klass.instance_methods.include?(:id)
    with_clause = if search_id && search_id.is_a?(Proc)
      search_id.call model
    else
      {search_id => model.id}
    end || {}
    with_clause = with_clause.merge rd.extra_condition if rd.extra_condition
    with_clause.keys.each do |k|
      if with_clause[k].is_a?(String) && !with_clause[k].is_numeric?
        with_clause[k] = with_clause[k].to_crc32 
      else
        with_clause[k] = with_clause[k].to_i 
      end
    end
    related_model_ids = klass.model_search('', {}, max_results, {:search_conditions => with_clause, :per_page => max_results, :order => order_clause}) || []
    related_models = klass.page_by_ids related_model_ids
    related_models.compact.map do |model|
      {:display_template => display_template, :model => model}
    end
  end
  
end


class ActionController::ModelRelationship
  # Name of the related data tab
  attr_accessor :display_name
  # The class that we are pulling the related data from
  attr_accessor :related_class
  # The search fields on the related model class that we should search on.  There may be multiple fields if two class have multiple ways of expressing relationships between the two of them.
  attr_accessor :search_id
  # Any extra conditions to restrict the relation; for example if there is a related union and non union workers tab; the Worker class would be related the same way to the company but depending on the type, we would restrict by whether the worker is union or not.
  attr_accessor :extra_condition
  # Order of returning the results
  attr_accessor :order
  # Template used to display the results
  attr_accessor :display_template
  # max number of related results to return
  attr_accessor :max_results
end