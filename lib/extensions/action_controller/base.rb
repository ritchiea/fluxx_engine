class ActionController::Base
  require 'fastercsv'

  LOCK_TIME_INTERVAL = 5.minutes

  helper_method :grab_param if respond_to?(:helper_method)
  helper_method :grab_param_or_model if respond_to?(:helper_method)
  
  def grab_param form_name, param_name
    params[param_name] || (params[form_name] ? params[form_name][param_name] : '')
  end
  
  def grab_param_or_model form_name, param_name, model
    grab_param(form_name, param_name).blank? ? model.send(param_name) : grab_param(form_name, param_name)
  end

  # Add an auto complete method to a controller
  def self.yui_auto_complete_for(object, method, options = {})
    define_method("auto_complete_for_#{object}_#{method}") do
    
      name_fields = options[:name_fields] || [:name]
      extra_block = options[:extra_block]
      extra_conditions = {}
      extra_conditions[:with] = options[:extra_conditions] if options[:extra_conditions]
      @items = object.to_s.camelize.constantize.search params[object][method].underscore.downcase, {:order => options[:order_clause], :per_page => (options[:results_per_page] || 10)}.merge(extra_conditions)
      extras = if extra_block && extra_block.is_a?(Proc)
        extra_block.call @items
      end || {}
      item_map = @items.map do |item| 
        name = name_fields.map {|field| item.send field}.join ' ' # Build a name based on the name fields
        {:name => name, :id => item.id, :extra => (extras[item.id] ? extras[item.id].to_json : nil)}
      end
      render :inline => {:ResultSet => item_map}.to_json
    end
  end
  
  #
  # model_class is the name of the model to generate CRUD methods for
  # options include:
  #   results_per_page: the number of results allowed per page; defaults to 25
  #   partial_new: the name of the new partial.  Defaults to 'partial_new'
  #
  def self.insta_index model_class, options={}
    really_delete = !(model_class.columns.map(&:name).include? 'deleted_at')
  
    # GET /model
    # GET /model.xml
    define_method :index do
      derive_model_instance_names model_class
      
      @delta_type = if options[:delta_type]
        options[:delta_type]
      else
        model_class.name
      end
      
      results_per_page = if request.format.csv? || request.format.xls?
        MAX_SPHINX_RESULTS
      else
        options[:results_per_page] || 25
      end
      
      p "ESH: have a model class = #{model_class.inspect}"

      model_ids = instance_variable_set @plural_model_instance_name, model_class.model_search(params, results_per_page, options, really_delete)
      search_conditions = (options[:search_conditions] || {}).clone
      if request.format.csv? || request.format.xls?
        unpaged_models = model_class.connection.execute model_class.send(:sanitize_sql, [model_class.csv_sql_query(search_conditions), model_ids])
      else
        unpaged_models = model_class.find :all, :conditions => ['id in (?)', model_ids]
        model_map = unpaged_models.inject({}) {|acc, model| acc[model.id] = model; acc}
        ordered_list = model_ids.map {|model_id| model_map[model_id]}
        @models = WillPaginate::Collection.create model_ids.current_page, model_ids.per_page, model_ids.total_entries do |pager|
          pager.replace ordered_list
        end
      end
      
      @view_attr_block = options[:view_attr_block]
      @view_attrs = options[:view_attrs] || [:name]
      respond_to do |format|
        format.html { render((options[:view] || "/insta/index").to_s, :layout => false) }
        format.xml  { render :xml => instance_variables[@plural_model_instance_name] }
        format.xls do
          stream_extract model_class, unpaged_models, search_conditions, :xls
        end
        format.csv do
          stream_extract model_class, unpaged_models, search_conditions, :csv
        end
      end
    end
  end
  

  def self.insta_show model_class, options={}
    really_delete = !(model_class.columns.map(&:name).include? 'deleted_at')

    # GET /models/1
    # GET /models/1.xml
    define_method :show do
      derive_model_instance_names model_class
      
      @model = if params[:audit_id]
        new_model = model_class.new
        audit = Audit.find params[:audit_id] rescue nil
        if audit
          m2 = YAML::load audit.full_model if audit.full_model
          if m2
            m2.keys.each do |k|
              k2 = "#{k.to_s}="
              new_model.send k2.to_sym, m2[k] rescue nil
            end
            new_model.id = audit.auditable_id
            new_model
          end
        end
      else
        show_condition = ['id = ?', params[:id]]
        show_condition = ['id = ? AND deleted_at IS NULL', params[:id]] unless really_delete
        models = instance_variable_set @singular_model_instance_name, model_class.find(:all, :conditions => show_condition)
        models.first
      end
      
      respond_to do |format|
        format.html do 
          if @model
            if params[:audit_id]
              @full_model = model_class.find(@model.id)
              audit_options = options.merge(:view_definition => options[:audit_view_definition]) unless options[:audit_view_definition].blank?
              audit_options = audit_options.merge(:footer_definition => options[:audit_footer_definition]) unless options[:audit_footer_definition].blank?
              fluxx_show_card audit_options
            elsif params[:mode]
              mode_options = options.merge(:view_definition => options[:mode_view_definition][params[:mode].to_s]) unless options[:mode_view_definition].blank? || options[:mode_view_definition][params[:mode].to_s].blank?
              fluxx_show_card mode_options
            else
              fluxx_show_card options
            end
          else
            if params[:audit_id]
              render :inline => t(:insta_no_audit_record_found, :model_id => params[:id])
            else
              render :inline => t(:insta_no_record_found, :model_id => params[:id])
            end
          end
        end
        format.xml  { render :xml => @model }
        format.pdf  { render :layout => false }
      end
    end
  end

  def self.insta_new model_class, options={}
    really_delete = !(model_class.columns.map(&:name).include? 'deleted_at')

    # GET /models/new
    # GET /models/new.xml
    define_method :new do
      derive_model_instance_names model_class
      @model = if @model
        @model
      elsif options[:new_block] && options[:new_block].is_a?(Proc)
        options[:new_block].call params
      else
        model_class.new
      end
      
      instance_variable_set @singular_model_instance_name, @model
      @multipart = options[:multi_part]
      @form_class = options[:form_class]
      @form_name = options[:form_name]
      @form_definition = options[:form_definition]
      @button_definition = options[:button_definition] || @model_human_name
      @button_verb = options[:button_verb]
      respond_to do |format|
        format.html { render((options[:view] || "/insta/new").to_s, :layout => false)}
        format.xml  { render :xml => @model }
      end
    end
  end

  def self.insta_edit model_class, options={}
    really_delete = !(model_class.columns.map(&:name).include? 'deleted_at')

    # GET /models/1/edit
    define_method :edit do
      derive_model_instance_names model_class
      edit_condition = nil
      edit_condition = 'deleted_at IS NULL' unless really_delete
      
      @model = if @model
        @model
      else
        instance_variable_set @singular_model_instance_name, model_class.find(params[:id], :conditions => edit_condition)
      end
      options[:button_definition] = @model_human_name unless options[:button_definition]
      respond_to do |format|
        if editable? @model
          add_lock @model
        else
          # Provide a locked error message
          flash[:error] = t(:record_is_locked, :name => (@model.locked_by ? @model.locked_by.full_name : ''), :lock_expiration => @model.locked_until.mdy_time)
          @not_editable=true
        end
        format.html { fluxx_edit_card options }
      end
    end
  end

  def self.insta_post model_class, options={}
    really_delete = !(model_class.columns.map(&:name).include? 'deleted_at')

    # POST /models
    # POST /models.xml
    define_method :create do
      derive_model_instance_names model_class
      @model = if @model
        @model
      else
        model_class.new(params[model_class.name.underscore.downcase.to_sym])
      end
      if @model.respond_to?(:created_by_id) && current_user
        @model.created_by_id = current_user.id
      end
      if @model.respond_to?(:modified_by_id) && current_user
        @model.modified_by_id = current_user.id
      end

      @model = instance_variable_set @singular_model_instance_name, @model
      @form_name = options[:form_name]
      @form_definition = options[:form_definition]
      @button_definition = options[:button_definition] || @model_human_name
      @button_verb = options[:button_verb]
      @link_to_method = options[:link_to_method]
      post_save_call = options[:post_save_call] || lambda{|current_user, model, params|true}
      if @model.save && post_save_call.call(current_user, @model, params)
        respond_to do |format|
          flash[:info] = t(:insta_successful_create, :name => model_class.name)
          format.html do
            if options[:render_inline] 
              render :inline => options[:render_inline]
            else
              extra_options = {:id => @model.id}
              extra_options[:controller] = options[:controller] if options[:controller]
              head 201, :location => options[:redirect] ? self.send(options[:redirect], extra_options) : url_for(@model)
            end
          end
          format.xml  { render :xml => @model, :status => :created, :location => @model }
        end
      else
        respond_to do |format|
          p "ESH: error saving record #{@model.errors.inspect}"
          flash[:error] = t(:errors_were_found)
          logger.debug("Unable to create "+@singular_model_instance_name.to_s+" with errors="+@model.errors.inspect)
          format.html { render((options[:view] || "/insta/new").to_s, :layout => false) }
          format.xml  { render :xml => @model.errors, :status => :unprocessable_entity }
        end
      end
    end
  end

  def self.insta_put model_class, options={}
    really_delete = !(model_class.columns.map(&:name).include? 'deleted_at')

    # PUT /models/1
    # PUT /models/1.xml
    define_method :update do
      derive_model_instance_names model_class
      update_condition = nil
      update_condition = 'deleted_at IS NULL' unless really_delete
      @model = if @model
        @model
      else 
        instance_variable_set @singular_model_instance_name, model_class.find(params[:id], :conditions => update_condition)
      end
      
      modified_by_map = {}
      if @model.respond_to?(:modified_by_id) && current_user
        modified_by_map[:modified_by_id] = current_user.id
      end
      @form_name = options[:form_name]
      @form_definition = options[:form_definition]
      @button_definition = options[:button_definition] || @model_human_name
      @button_verb = options[:button_verb]
      post_save_call = options[:post_save_call] || lambda{|current_user, model, params|true}

      if editable? @model
        remove_lock @model
      

        respond_to do |format|
          if @model.update_attributes(modified_by_map.merge(params[model_class.name.underscore.downcase.to_sym] || {})) && post_save_call.call(current_user, @model, params)
            flash[:info] = t(:insta_successful_update, :name => model_class.name)
            format.html do
              if options[:render_inline] 
                render :inline => options[:render_inline]
              else
                extra_options = {:id => @model.id}
                extra_options[:controller] = options[:controller] if options[:controller]
                redirect_to(options[:redirect] ? self.send(options[:redirect], extra_options) : @model) 
              end
            end
            format.xml  { head :ok }
          else
            
            add_lock @model
            flash[:error] = t(:errors_were_found)
            logger.debug("Unable to save "+@singular_model_instance_name.to_s+" with errors="+@model.errors.inspect)
            format.html { render((options[:view] || "/insta/edit").to_s, :layout => false) }
            format.xml  { render :xml => @model.errors, :status => :unprocessable_entity }
          end
        end
      else
        respond_to do |format|
          # Provide a locked error message
          flash[:error] = t(:record_is_locked, :name => (@model.locked_by ? @model.locked_by.full_name : ''), :lock_expiration => @model.locked_until.mdy_time)
          format.html { render((options[:view] || "/insta/edit").to_s, :layout => false) }
          format.xml  { render :xml => @model.errors, :status => :unprocessable_entity }
          @not_editable=true
        end
      end
    end
  end

  def self.insta_delete model_class, options={}
    really_delete = !(model_class.columns.map(&:name).include? 'deleted_at')

    # DELETE /models/1
    # DELETE /models/1.xml
    define_method :destroy do
      derive_model_instance_names model_class
      deleted_at_condition = nil
      deleted_at_condition = 'deleted_at IS NULL' unless really_delete
        
      @model = if @model
        @model
      else 
        instance_variable_set @singular_model_instance_name, model_class.find(params[:id], :conditions => deleted_at_condition)
      end
      if @model.respond_to?(:modified_by_id) && current_user
        @model.modified_by_id = current_user.id
      end
      unless really_delete
        @model.deleted_at = Time.now
        @model.save_without_validation
      else
        @model.destroy
      end
      flash[:info] = t(:insta_successful_delete, :name => model_class.name)

      respond_to do |format|
        format.html { redirect_to(self.send(options[:redirect] || "#{model_class.name.underscore.downcase}_path")) }
        format.xml  { head :ok }
      end
    end
  end

  def derive_model_instance_names model_class
    @model_name = model_class.name.underscore.downcase
    @model_human_name = @model_name.gsub('_', ' ').titlecase
    @plural_model_name = "#{@model_name}s"
    @singular_model_instance_name = "@#{@model_name}".to_sym
    @plural_model_instance_name = "@#{@plural_model_name}".to_sym
  end
  
  def clean_search_conditions options
    ret_options = options.clone
    [:extra_conditions, :name_fields, :extra_block].each {|opt| ret_options.delete opt}
    ret_options
  end
  
  def editable? model
    !(@model.respond_to?(:locked_until) && @model.respond_to?(:locked_by)) || @model.locked_until.nil? || @model.locked_until < Time.now || @model.locked_by == current_user
  end
  
  def add_lock model
    if editable?(model)
      if model.respond_to? :without_delta
        model.class.without_delta do
          add_lock_update_attributes model
        end
      else
        add_lock_update_attributes model
      end
    end
  end
  
  def add_lock_update_attributes model
    if is_lockable?(model)
      model = model.class.find model.id
      model.class.suspended_delta(false) do
        model.update_attribute :locked_until, Time.now + LOCK_TIME_INTERVAL
        model.update_attribute :locked_by_id, current_user.id
      end
    end
  end

  def extend_lock model
    if editable?(model)
      if model.respond_to? :without_delta
        model.class.without_delta do
          extend_lock_update_attributes model
        end
      else
        extend_lock_update_attributes model
      end
    end
  end
  
  # Either extend the current lock by LOCK_TIME_INTERVAL minutes or add a lock LOCK_TIME_INTERVAL from Time.now
  def extend_lock_update_attributes model
    if is_lockable?(model)
      model = model.class.find model.id
      model.class.suspended_delta(false) do
        if model.locked_until && model.locked_until > Time.now
          interval = model.locked_until + LOCK_TIME_INTERVAL
          model.update_attribute :locked_until, interval
          model.locked_until = interval
        else
          interval = model.locked_until + LOCK_TIME_INTERVAL
          model.update_attribute :locked_until, interval
          model.locked_until = interval
        end
        model.update_attribute :locked_by_id, current_user.id
        model.locked_by_id = current_user.id
      end
    end
  end
  
  def remove_lock model
    if editable?(model)
      if model.respond_to? :without_delta
        model.class.without_delta do
          remove_lock_update_attributes model
        end
      else
        remove_lock_update_attributes model
      end
    end
  end
  
  def remove_lock_update_attributes model
    if is_lockable?(model)
      model.class.suspended_delta(false) do
        model.update_attributes :locked_until => nil, :locked_by => nil
        model.locked_until = nil
        model.locked_by = nil
      end
    end
  end
  
  def is_lockable? model
    model.respond_to?(:locked_until) && model.respond_to?(:locked_by)
  end
  
  def stream_extract model_class, unpaged_models, search_conditions, extract_type
    filename = 'fluxx_' + model_class.csv_filename(search_conditions) + '_' + Time.now.strftime("%m%d%y") + ".#{extract_type.to_s}"
    
    if extract_type == :xls
      stream_xls filename, extract_type, model_class.csv_headers(search_conditions), unpaged_models
    else
      stream_csv( filename, extract_type ) do |csv|
        headers = model_class.csv_headers(search_conditions).map do |header_record| 
          if header_record.is_a?(Array)
            header_record.first
          else
            header_record
          end
        end
        
        csv << headers

        (1..unpaged_models.num_rows).each do
          csv << unpaged_models.fetch_row
        end
      end
    end
  end
end