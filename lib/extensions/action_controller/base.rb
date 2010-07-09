class ActionController::Base
  require 'fastercsv'

  helper_method :grab_param if respond_to?(:helper_method)
  helper_method :grab_param_or_model if respond_to?(:helper_method)
  
  
  def grab_param form_name, param_name
    params[param_name] || (params[form_name] ? params[form_name][param_name] : '')
  end
  
  def grab_param_or_model form_name, param_name, model
    grab_param(form_name, param_name).blank? ? model.send(param_name) : grab_param(form_name, param_name)
  end
  
  #
  # model_class is the name of the model to generate CRUD methods for
  # options include:
  #   results_per_page: the number of results allowed per page; defaults to 25
  #   partial_new: the name of the new partial.  Defaults to 'partial_new'
  #
  def self.insta_index model_class
    index_object = ActionController::ControllerDslIndex.new model_class
    yield index_object if block_given?

    define_method :index do
      index_object.invoke_pre params, request, response
      
      @delta_type = if index_object.delta_type
        index_object.delta_type
      else
        model_class.name
      end
      
      @template = index_object.template
      @models = index_object.load_results params, request.format
      instance_variable_set index_object.plural_model_instance_name, @models
      
      insta_respond_to index_object do |format|
        format.html { render((index_object.view || "#{insta_path}/index").to_s, :layout => false) }
        format.xml  { render :xml => instance_variables[@plural_model_instance_name] }
        format.json do
          render :text => index_object.process_autocomplete(@models)
        end
        format.xls do
          self.response_body = index_object.stream_extract request, headers, @models, index_object.search_conditions, :xls
        end
        format.csv do
          self.response_body = index_object.stream_extract request, headers, @models, index_object.search_conditions, :csv
        end
      end

      index_object.invoke_post params, request, response
    end
  end
  
  def self.insta_show model_class
    show_object = ActionController::ControllerDslShow.new model_class
    yield show_object if block_given?

    # GET /models/1
    # GET /models/1.xml
    define_method :show do
      show_object.invoke_pre params, request, response

      @model = show_object.perform_show params
      @model_name = show_object.model_name
      @related = load_related_data(@model) if self.respond_to? :load_related_data
      insta_respond_to show_object do |format|
        format.html do 
          if @model
            fluxx_show_card show_object, show_object.calculate_show_options(@model, params)
          else
            render :inline => show_object.calculate_error_options(params)
          end
        end
        format.xml  { render :xml => @model }
      end

      show_object.invoke_post params, request, response
    end
  end

  def self.insta_new model_class, options={}
    new_object = ActionController::ControllerDslNew.new model_class
    yield new_object if block_given?

    # GET /models/new
    # GET /models/new.xml
    define_method :new do
      new_object.invoke_pre params, request, response
      @model = new_object.load_new_model params, @model
      
      instance_variable_set new_object.singular_model_instance_name, @model
      @template = new_object.template
      @form_class = new_object.form_class
      @form_url = new_object.form_url
      insta_respond_to new_object do |format|
        format.html { render((new_object.view || "#{insta_path}/new").to_s, :layout => false)}
        format.xml  { render :xml => @model }
      end

      new_object.invoke_post params, request, response
    end
  end

  def self.insta_edit model_class
    edit_object = ActionController::ControllerDslEdit.new model_class
    yield edit_object if block_given?

    # GET /models/1/edit
    define_method :edit do
      edit_object.invoke_pre params, request, response
      
      insta_respond_to edit_object do |format|
        @model = edit_object.perform_edit params, @model
        unless edit_object.editable? @model, fluxx_current_user
          # Provide a locked error message
          flash[:error] = t(:record_is_locked, :name => (@model.locked_by ? @model.locked_by.full_name : ''), :lock_expiration => @model.locked_until.mdy_time)
          @not_editable=true
        end
        format.html { fluxx_edit_card edit_object }
      end
      
      edit_object.invoke_post params, request, response
    end
  end

  def self.insta_post model_class
    create_object = ActionController::ControllerDslCreate.new model_class
    yield create_object if block_given?

    # POST /models
    # POST /models.xml
    define_method :create do
      create_object.invoke_pre params, request, response

      @model = create_object.load_new_model params, @model
      instance_variable_set create_object.singular_model_instance_name, @model
      @template = create_object.template
      @form_class = create_object.form_class
      @form_url = create_object.form_url
      @link_to_method = create_object.link_to_method
      if create_object.perform_create params, @model, fluxx_current_user
        insta_respond_to create_object do |format|
          flash[:info] = t(:insta_successful_create, :name => model_class.name)
          format.html do
            if create_object.render_inline
              render :inline => create_object.render_inline
            else
              extra_options = {:id => @model.id}
              head 201, :location => create_object.redirect ? self.send(create_object.redirect, extra_options) : url_for(@model)
            end
          end
          format.xml  { render :xml => @model, :status => :created, :location => @model }
        end
      else
        insta_respond_to create_object do |format|
          p "ESH: error saving record #{@model.errors.inspect}"
          flash[:error] = t(:errors_were_found)
          logger.debug("Unable to create "+create_object.singular_model_instance_name.to_s+" with errors="+@model.errors.inspect)
          format.html { render((create_object.view || "#{insta_path}/new").to_s, :layout => false) }
          format.xml  { render :xml => @model.errors, :status => :unprocessable_entity }
        end
      end
      
      create_object.invoke_post params, request, response
    end
  end

  def self.insta_put model_class
    update_object = ActionController::ControllerDslUpdate.new model_class
    yield update_object if block_given?

    # PUT /models/1
    # PUT /models/1.xml
    define_method :update do 
      update_object.invoke_pre params, request, response

      @template = update_object.template
      @form_class = update_object.form_class
      @form_url = update_object.form_url
      
      @model = update_object.load_existing_model params, @model
      instance_variable_set update_object.singular_model_instance_name, @model

      if update_object.editable? @model, fluxx_current_user
        insta_respond_to update_object do |format|
          if update_object.perform_update params, @model, fluxx_current_user
            flash[:info] = t(:insta_successful_update, :name => model_class.name)
            format.html do
              if update_object.render_inline 
                render :inline => update_object.render_inline
              else
                extra_options = {:id => @model.id}
                redirect_to(update_object.redirect ? self.send(update_object.redirect, extra_options) : @model) 
              end
            end
            format.xml  { head :ok }
          else
            flash[:error] = t(:errors_were_found)
            logger.debug("Unable to save "+update_object.singular_model_instance_name.to_s+" with errors="+@model.errors.inspect)
            format.html { render((update_object.view || "#{insta_path}/edit").to_s, :layout => false) }
            format.xml  { render :xml => @model.errors, :status => :unprocessable_entity }
          end
        end
      else
        flash[:error] = t(:record_is_locked, :name => (@model.locked_by ? @model.locked_by.to_s : ''), :lock_expiration => @model.locked_until.mdy_time)
        @not_editable=true
        insta_respond_to update_object do |format|
          # Provide a locked error message
          format.html { render((update_object.view || "#{insta_path}/edit").to_s, :layout => false) }
          format.xml  { render :xml => @model.errors, :status => :unprocessable_entity }
        end
      end

      update_object.invoke_post params, request, response
    end
  end

  def self.insta_delete model_class
    delete_object = ActionController::ControllerDslDelete.new model_class
    yield delete_object if block_given?

    # DELETE /models/1
    # DELETE /models/1.xml
    define_method :destroy do
      delete_object.invoke_pre params, request, response

      @model = delete_object.load_existing_model params, @model
      instance_variable_set delete_object.singular_model_instance_name, @model
      if delete_object.perform_delete params, @model, fluxx_current_user
        flash[:info] = t(:insta_successful_delete, :name => model_class.name)
      else
        flash[:error] = t(:insta_unsuccessful_delete, :name => model_class.name)
      end

      insta_respond_to delete_object do |format|
        format.html { redirect_to((delete_object.redirect ? self.send(delete_object.redirect): nil) || "#{model_class.name.underscore.downcase}_path") }
        format.xml  { head :ok }
      end

      delete_object.invoke_post params, request, response
    end
  end
  
  def self.insta_related model_class
    local_related_object = ActionController::ControllerDslRelated.new(model_class)
    yield local_related_object if block_given?
    define_method :load_related_data do |model|
      local_related_object.load_related_data model
    end
  end
  
  def insta_path
    "#{File.dirname(__FILE__).to_s}/../../../app/views/insta"
  end
  
  def fluxx_show_card show_object, options
    @template = options[:template]
    @footer_template = options[:footer_template]
    # TODO ESH: chase down where exclude_related_data and layout comes from...
    @exclude_related_data = show_object.exclude_related_data
    @layout = show_object.layout
    render((show_object.view || "#{insta_path}/show").to_s, :layout => @layout)
  end
  
  def fluxx_edit_card edit_object
    @template = edit_object.template
    @form_class = edit_object.form_class
    @form_url = edit_object.form_url
    render((edit_object.view || "#{insta_path}/edit").to_s, :layout => false)
  end
  
  protected
  def fluxx_current_user
    current_user if respond_to?(:current_user)
  end
  
  def insta_respond_to controller_dsl
    if block_given?
      format_block_map = BlobStruct.new
      yield format_block_map
      
      format_blocks_merged = if controller_dsl.format_block_map && controller_dsl.format_block_map.is_a?(Hash)
        controller_dsl.format_block_map.store.merge format_block_map.store
      else
        format_block_map.store
      end

      respond_to do |format|
        format_blocks_merged.keys.each do |key|
          format.send key.to_sym do
            format_blocks_merged[key].call
          end
        end
      end
    end
  end
end