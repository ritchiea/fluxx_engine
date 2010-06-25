class ActionController::ControllerDslAutocomplete < ActionController::ControllerDsl
  # results per page; pagination default
  attr_accessor :results_per_page
  # any extra search conditions to be appended to the search string
  attr_accessor :search_conditions
  # sorting for the search
  attr_accessor :order_clause
  # block to postprocess autocomplete results
  attr_accessor :postprocess_block
  # any additional relationships to include
  attr_accessor :include_relation
  
  def process_autocomplete params
    q_search = if params[:term]
      params[:term]
    else
      ''
    end
    
    # Use the model_search to search based on the criteria
    model_ids = model_class.model_search(q_search, params, results_per_page, 
      {:search_conditions => self.search_conditions, :order_clause => self.order_clause, :include_relation => include_relation}, 
      really_delete)
    models = model_class.page_by_ids model_ids
      
    formatting = if postprocess_block && postprocess_block.is_a?(Proc)
      postprocess_block.call models
    else
      name_method = if model_class.public_instance_methods.include?(:autocomplete_to_s)
        :autocomplete_to_s
      elsif model_class.public_instance_methods.include?(:view_to_s)
        :view_to_s
      elsif model_class.public_instance_methods.include?(:value)
        :value
      elsif model_class.public_instance_methods.include?(:name)
        :name
      else
        :to_s
      end
      models.map do |model|
        {:label => model.send(name_method), :value => model.id}
      end.to_json
    end
  end
end