class ActionController::ControllerDslIndex < ActionController::ControllerDsl
  attr_accessor :delta_type
  attr_accessor :results_per_page
  attr_accessor :search_conditions
  
  ## Use ActionController::ControllerDslIndex.max_sphinx_results= to set a different value
  def self.max_sphinx_results= max_sphinx_results
    @search_attributes = {}
  end
  
  def self.max_sphinx_results
    @search_attributes || 500000
  end
  
  def load_results request, params
    results_per_page = if request.format.csv? || request.format.xls?
      ActionController::ControllerDslIndex.max_sphinx_results
    else
      self.results_per_page || 25
    end
    
    p "ESH: have a model class = #{model_class.inspect}"

    # TODO ESH: adjust options to pass in the appropriate OPTIONS parameters
    model_ids = instance_variable_set @plural_model_instance_name, model_class.model_search(params, results_per_page, {}, really_delete)
    search_conditions = (self.search_conditions || {}).clone
    if request.format.csv? || request.format.xls?
      p "ESH: have a #{model_class.csv_sql_query(search_conditions).inspect}"
      unless model_class.csv_sql_query(search_conditions).blank?
        unpaged_models = model_class.find_by_sql [model_class.csv_sql_query(search_conditions), model_ids]
      else
        unpaged_models = model_class.find model_ids
      end
    else
      unpaged_models = model_class.find :all, :conditions => ['id in (?)', model_ids]
      model_map = unpaged_models.inject({}) {|acc, model| acc[model.id] = model; acc}
      ordered_list = model_ids.map {|model_id| model_map[model_id]}
      WillPaginate::Collection.create model_ids.current_page, model_ids.per_page, model_ids.total_entries do |pager|
        pager.replace ordered_list
      end
    end
    
  end
end