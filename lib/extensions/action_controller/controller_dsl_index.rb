class ActionController::ControllerDslIndex < ActionController::ControllerDsl
  # delta_type allows the user to override the class name for the purposes of tracking realtime updates
  attr_accessor :delta_type
  # results per page; pagination default
  attr_accessor :results_per_page
  # any extra search conditions to be appended to the search string
  attr_accessor :search_conditions
  # sorting for the search
  attr_accessor :order_clause
  # any additional relationships to include
  attr_accessor :include_relation
  
  ## Use ActionController::ControllerDslIndex.max_sphinx_results= to set a different value
  def self.max_sphinx_results= max_sphinx_results
    @search_attributes = {}
  end
  
  def self.max_sphinx_results
    @search_attributes || 500000
  end
  
  def load_results params, format=nil
    results_per_page = if format && (format.csv? || format.xls?)
      ActionController::ControllerDslIndex.max_sphinx_results
    else
      self.results_per_page || 25
    end
    
    q_search = if params[:q] && params[:q][:q]
      params[:q][:q]
    elsif params[:q]
      params[:q]
    else
      ''
    end
    model_ids = instance_variable_set @plural_model_instance_name, model_class.model_search(q_search, params, results_per_page, 
      {:search_conditions => self.search_conditions, :order_clause => self.order_clause, :include_relation => include_relation}, 
      really_delete)
      
    local_search_conditions = (self.search_conditions || {}).clone
    if format && (format.csv? || format.xls?)
      unless model_class.csv_sql_query(local_search_conditions).blank?
        unpaged_models = model_class.find_by_sql [model_class.csv_sql_query(local_search_conditions), model_ids]
      else
        unpaged_models = model_class.find model_ids
      end
    else
      model_class.page_by_ids model_ids
    end
  end
end