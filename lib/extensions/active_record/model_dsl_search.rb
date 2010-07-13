class ActiveRecord::ModelDslSearch < ActiveRecord::ModelDsl
  # Filter fields are used to specify the names of fields which may be used for filtering
  attr_accessor :filter_fields
  # Derived filters allow you to specify a hash of blocks indexed by the filter names.  For each block the parameters search_with_attributes, val are passed in.  
  #  search_with_attributes is a Hash that adds in conditions to the query.  val contains the posted filter value.
  attr_accessor :derived_filters

  def safe_find model_id
    update_condition = nil
    update_condition = 'deleted_at IS NULL' unless really_delete
    model_class.find(model_id, :conditions => update_condition)
  end
  
  def safe_delete model, fluxx_current_user=nil
    if model.respond_to?(:updated_by_id) && fluxx_current_user
      model.updated_by_id = fluxx_current_user.id
    end
    unless really_delete
      model.deleted_at = Time.now
      model.save(:validate => false)
    else
      model.destroy
    end
    
    model
  end

  def model_search q_search, request_params, results_per_page=25, options={}
    if model_class.respond_to?(:sphinx_indexes) && model_class.sphinx_indexes
      sphinx_model_search q_search, request_params, results_per_page, options
    else
      sql_model_search q_search, request_params, results_per_page, options
    end
  end

  def sql_model_search q_search, request_params, results_per_page=25, options={}
    string_fields = model_class.columns.select {|col| col.type == :string}.map &:name
    queries = q_search.split ' '
    queries = queries.reject {|q| q.blank?}
    sql_conditions = string_fields.map {|field| queries.map {|q| model_class.send :sanitize_sql, ["#{field} like ?", "%#{q}%"]} }.flatten.compact.join ' OR '
    sql_conditions = "(#{sql_conditions})" unless sql_conditions.blank?
    sql_conditions += " #{sql_conditions.blank? ? '' : ' AND '} deleted_at IS NULL " unless really_delete
    if options[:with]
      logger.info "Note that sql_model_search does not currently support :with"
    end
    
    unless filter_fields.blank?
      filter_fields.each do |attr|
        unless request_params[attr].blank?
          split_params = request_params[attr].split(',')
          unless split_params.blank?
            attr_sql = model_class.send :sanitize_sql, [" #{attr} in (?) ", split_params]
            sql_conditions += " #{sql_conditions.blank? ? '' : ' AND '}  #{attr_sql}" 
          end
        end
      end
    end

    # Grab a list of models with just the ID, then swap out the list of models with a list of the IDs
    # TODO ESH: should upgrade to arel syntax
    models = model_class.paginate :select => :id, :conditions => "#{sql_conditions} #{(!sql_conditions.blank? && !options[:search_conditions].blank?) ? " AND " : ''} #{options[:search_conditions]}", 
      :page => request_params[:page], :per_page => results_per_page, 
      :order => options[:order_clause], :include => options[:include_relation]
    models.replace models.map(&:id)
    models
  end

  def sphinx_model_search q_search, request_params, results_per_page=25, options={}
    search_with_attributes = if options[:search_conditions]
      options[:search_conditions].clone 
    end || {}
    
    search_with_attributes.keys.each do |k|
      search_with_attributes[k] = search_with_attributes[k].to_crc32 unless search_with_attributes[k].to_s.is_numeric?
    end

    search_with_attributes[:deleted_at] = 0 unless really_delete

    unless filter_fields.blank?
      filter_fields.each do |attr|
        unless request_params[attr].blank?
          split_params = request_params[attr].split(',')
          if derived_filters && derived_filters[attr] # some attributes have filtering methods; if so call it
            derived_filters[attr].call(search_with_attributes, request_params[attr]) # Send the raw un-split value
          elsif split_params.select{|split_param| !split_param.is_numeric?}.size > 0 # Check to see if any params are NOT numeric
            # Sphinx doesn't allow string attributes, so if we get a non-numeric value, search for the crc32 hash of it
            values = split_params.map{|val|val.to_crc32}
            search_with_attributes[attr] = values
          else
            search_with_attributes[attr] = split_params.map{|val| val.to_i}
          end
        end
      end
    end
    
    with_clause = (search_with_attributes || {})
    order_clause = if request_params[:sort_attribute] && request_params[:sort_order]
      "#{request_params[:sort_attribute]} #{request_params[:sort_order]}"
    else
      options[:order_clause]
    end

    p "searching for #{q_search}, with_clause = #{with_clause.inspect}, order_clause=#{order_clause.inspect}"
    model_ids = model_class.search_for_ids(
      q_search, :with => with_clause.merge(options[:with] || {}),
      :order => order_clause, :page => request_params[:page], 
      :per_page => results_per_page, :include => options[:include_relation])
    if model_ids.empty? && request_params[:page]
      p "ESH: Could be we are loading a card listing with pagination that used to work, but now has fewer elements in it, so we should fall back to display the first page"
      # Could be we are loading a card listing with pagination that used to work, but now has fewer elements in it, so we should fall back to display the first page
      model_ids = model_class.search_for_ids(
        q_search, :with => with_clause,
        :order => order_clause,
        :per_page => results_per_page, :include => options[:include_relation])
    end
    model_ids
  end
end