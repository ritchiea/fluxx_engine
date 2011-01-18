class ActionController::Base
  require 'fastercsv' if RUBY_VERSION < '1.9'

  attr_accessor :pre_models
  attr_accessor :pre_model

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
  # If you pass in a parameter skip_wrapper=true, just the partial will be rendered with no #card-header, #card-body, #card-footer wrapping
  #
  def self.insta_index model_class=nil
    if respond_to?(:class_index_object) && class_index_object
      yield class_index_object if block_given?
    else
      index_object = ActionController::ControllerDslIndex.new(model_class)
      class_inheritable_reader :class_index_object
      write_inheritable_attribute :class_index_object, index_object
      yield index_object if block_given?
    
      define_method :insta_index_object do
        index_object
      end
    
      self.instance_eval do
        def insta_class_index_object
          class_index_object
        end
      end

      define_method :index do
        raise UnauthorizedException.new("listview", index_object.model_class) unless fluxx_current_user.has_listview_for_model?(index_object.model_class)
        index_object.invoke_pre self
      
        # This tells the front end the name of the type of object that is represented in this card
        @delta_type = if index_object.delta_type
          index_object.delta_type
        else
          model_class ? model_class.name : nil
        end
      
        @model_class = index_object.model_class
        @icon_style = index_object.icon_style
        @suppress_model_anchor_tag = index_object.suppress_model_anchor_tag
        @suppress_model_iteration = index_object.suppress_model_iteration
        @skip_wrapper = @skip_wrapper || params[:skip_wrapper] || index_object.always_skip_wrapper
        
        if params[:view] == 'filter'
          @filter_title = index_object.filter_title || "Filter #{index_object.model_class.name.humanize.downcase.pluralize}"
          @filter_template = index_object.filter_template
          render((index_object.filter_view || "#{insta_path}/filter").to_s, :layout => false)
        else
          @template = index_object.template
          @models = index_object.load_results params, request.format, pre_models
          @first_report_id = self.respond_to?(:insta_index_report_list) && !(insta_index_report_list.empty?) && insta_index_report_list.first.report_id
          instance_variable_set index_object.plural_model_instance_name, @models if index_object.plural_model_instance_name
      
          index_object.invoke_post self, @models
          insta_respond_to index_object do |format|
            format.html do
              @report = if params[:fluxxreport_id] && @first_report_id
                insta_report_find_by_id params[:fluxxreport_id].to_i
              end
              if @report
                @report_list = insta_index_report_list
                if params[:document]
                  headers = @report.compute_index_document_headers self, index_object, params, @models
                  add_headers headers[0], headers[1]
                  controller = self
                  render :text => @report.compute_index_document_data(controller, index_object, params, @models)
                else
                  @report_data = @report.compute_index_plot_data self, index_object, params, @models
                  fluxx_show_card index_object, {:template => (@report.plot_template || 'insta/show/report_template'), 
                     :footer_template => (@report.plot_template_footer || 'insta/show/report_template_footer')}
                end
              else
                render((index_object.view || "#{insta_path}/index").to_s, :layout => false) 
              end
            end
            format.xml  { render :xml => instance_variables[@plural_model_instance_name] }
            format.json do
              render :text => @models.to_json
            end
            format.autocomplete do
              render :text => index_object.process_autocomplete(@models, params[:name_method], self)
            end
            format.xls do
              self.response_body = index_object.stream_extract request, headers, @models, index_object.search_conditions, :xls
            end
            format.csv do
              self.response_body = index_object.stream_extract request, headers, @models, index_object.search_conditions, :csv
            end
          end
        end
      end
    end
  end
  
  def self.insta_show model_class=nil
    if respond_to?(:class_show_object) && class_show_object
      yield class_show_object if block_given?
    else
      show_object = ActionController::ControllerDslShow.new(model_class)
      class_inheritable_reader :class_show_object
      write_inheritable_attribute :class_show_object, show_object
      yield show_object if block_given?

      define_method :insta_show_object do
        show_object
      end
    
      self.instance_eval do
        def insta_class_show_object
          class_show_object
        end
      end
    
      # GET /models/1
      # GET /models/1.xml
      define_method :show do
        show_object.invoke_pre self

        @model = if params[:id] && self.respond_to?(:insta_show_report_list) && !(insta_show_report_list.empty?)
          @report = insta_report_find_by_id params[:id].to_i
          @report_list = insta_index_report_list
          @report
        else
          show_object.perform_show params, pre_model
        end
        @model_class = show_object.model_class
        
        raise UnauthorizedException.new('view', (@model || @model_class)) unless fluxx_current_user.has_view_for_model?(@model || @model_class)
        @icon_style = show_object.icon_style
        @model_name = @model ? @model.class.name.underscore.downcase : show_object.model_name
        @skip_wrapper = @skip_wrapper || params[:skip_wrapper] || show_object.always_skip_wrapper

        show_object.invoke_post self, @model
        if @model
          @related = load_related_data(@model) if self.respond_to? :load_related_data
          insta_respond_to show_object, :success do |format|
            format.html do 
              if @report && @report.filter_template && params[:fluxxreport_filter] 
                @filter_template = @report.filter_template
                render 'insta/report_filter', :layout => false
              elsif @report
                @reports = insta_show_report_list
                if params[:document]
                  headers = @report.compute_show_document_headers self, show_object, params
                  add_headers headers[0], headers[1]
                  render :text => @report.compute_show_document_data(self, show_object, params)
                else
                  @report_data = @report.compute_show_plot_data self, show_object, params
                  fluxx_show_card show_object, {:template => (@report.plot_template || 'insta/show/report_template'), 
                     :footer_template => (@report.plot_template_footer || 'insta/show/report_template_footer')}
                end
              else
                fluxx_show_card show_object, show_object.calculate_show_options(@model, params)
              end
            end
            format.json do
              render :inline => {@model.class.name.tableize.singularize => @model.attributes, :url => url_for(@model)}.to_json
            end
            format.xml  { render :xml => @model }
          end
        else
          insta_respond_to show_object, :error do |format|
            format.html do 
              fluxx_show_card show_object, :template => 'insta/missing_record'
            end
            format.xml  { render :xml => @model }
          end
        end
      end
    end
  end

  def self.insta_new model_class, options={}
    if respond_to?(:class_new_object) && class_new_object
      yield class_new_object if block_given?
    else
      new_object = ActionController::ControllerDslNew.new(model_class)
      class_inheritable_reader :show_object
      write_inheritable_attribute :show_object, new_object
      yield new_object if block_given?

      define_method :insta_new_object do
        new_object
      end
    
      self.instance_eval do
        def insta_class_new_object
          class_new_object
        end
      end
    
      # GET /models/new
      # GET /models/new.xml
      define_method :new do
        new_object.invoke_pre self
        @model = new_object.load_new_model params, pre_model
        @model_class = new_object.model_class
        raise UnauthorizedException.new('create', @model_class) unless fluxx_current_user.has_create_for_model?(@model_class)
        @icon_style = new_object.icon_style
      
        instance_variable_set new_object.singular_model_instance_name, @model
        @template = new_object.template
        @form_class = new_object.form_class
        @form_url = new_object.form_url

        new_object.invoke_post self, @model
        insta_respond_to new_object do |format|
          format.html { render((new_object.view || "#{insta_path}/new").to_s, :layout => false)}
          format.xml  { render :xml => @model }
        end
      end
    end
  end

  def self.insta_edit model_class
    if respond_to?(:class_edit_object) && class_edit_object
      yield class_edit_object if block_given?
    else
      edit_object = ActionController::ControllerDslEdit.new(model_class)
      class_inheritable_reader :class_edit_object
      write_inheritable_attribute :class_edit_object, edit_object
      yield edit_object if block_given?

      define_method :insta_edit_object do
        edit_object
      end
    
      self.instance_eval do
        def insta_class_edit_object
          class_edit_object
        end
      end

      # GET /models/1/edit
      define_method :edit do
        edit_object.invoke_pre self
      
        @model = edit_object.perform_edit params, pre_model, fluxx_current_user
        @model_class = edit_object.model_class
        raise UnauthorizedException.new('update', (@model || @model_class)) unless fluxx_current_user.has_update_for_model?(@model || @model_class)
        @icon_style = edit_object.icon_style
        edit_object.invoke_post self, @model
        unless edit_object.editable? @model, fluxx_current_user
          # Provide a locked error message
          flash[:error] = t(:record_is_locked, :name => (@model.locked_by ? @model.locked_by.to_s : ''), :lock_expiration => @model.locked_until.mdy_time)
          @not_editable=true
          insta_respond_to edit_object, :locked do |format|
            format.html { fluxx_edit_card edit_object }
          end
        else
          insta_respond_to edit_object, :success do |format|
            format.html { fluxx_edit_card edit_object }
          end
        end
      end
    end
  end

  def self.insta_post model_class
    if respond_to?(:class_create_object) && class_create_object
      yield class_create_object if block_given?
    else
      create_object = ActionController::ControllerDslCreate.new(model_class)
      class_inheritable_reader :class_create_object
      write_inheritable_attribute :class_create_object, create_object
      yield create_object if block_given?

      define_method :insta_create_object do
        create_object
      end
    
      self.instance_eval do
        def insta_class_create_object
          class_create_object
        end
      end
    
      # POST /models
      # POST /models.xml
      define_method :create do
        create_object.invoke_pre self

        @model = create_object.load_new_model params, pre_model
        @model_class = create_object.model_class
        raise UnauthorizedException.new('create', @model_class) unless fluxx_current_user.has_create_for_model?(@model_class)
        @icon_style = create_object.icon_style
        instance_variable_set create_object.singular_model_instance_name, @model
        @template = create_object.template
        @form_class = create_object.form_class
        @form_url = create_object.form_url
        @link_to_method = create_object.link_to_method
        create_result = create_object.perform_create params, @model, fluxx_current_user
      
        create_object.invoke_post self, @model
        if create_result
          response.headers['fluxx_result_success'] = 'create'
          
          flash[:info] = t(:insta_successful_create, :name => model_class.model_name.human) unless create_object.dont_display_flash_message
          insta_respond_to create_object, :success do |format|
            format.html do
              handle_successful_create
            end
            format.json do
              handle_successful_create
            end
            format.xml  { render :xml => @model, :status => :created, :location => @model }
          end
        else
          response.headers['fluxx_result_failure'] = 'create'
          insta_respond_to create_object, :error do |format|
            p "ESH: error saving record #{@model.errors.inspect}"
            flash[:error] = t(:errors_were_found) unless flash[:error]
            logger.debug("Unable to create "+create_object.singular_model_instance_name.to_s+" with errors="+@model.errors.inspect)
            format.html { render((create_object.view || "#{insta_path}/new").to_s, :layout => false) }
            # TODO ESH: revisit what to send back for JSON error
            format.json { head 500 }
            format.xml  { render :xml => @model.errors, :status => :unprocessable_entity }
          end
        end
      end
      
      define_method :handle_successful_create do
        if create_object.render_inline
          render :inline => create_object.render_inline
        else
          extra_options = {:id => @model.id}
          head 201, :location => create_object.redirect ? self.send(create_object.redirect, extra_options) : url_for(@model)
        end
      end
    end
  end

  def self.insta_put model_class
    if respond_to?(:class_update_object) && class_update_object
      yield class_update_object if block_given?
    else
      update_object = ActionController::ControllerDslUpdate.new(model_class)
      class_inheritable_reader :class_update_object
      write_inheritable_attribute :class_update_object, update_object
      yield update_object if block_given?

      define_method :insta_update_object do
        update_object
      end
    
      self.instance_eval do
        def insta_class_update_object
          class_update_object
        end
      end

      # PUT /models/1
      # PUT /models/1.xml
      define_method :update do 
        update_object.invoke_pre self

        @template = update_object.template
        @form_class = update_object.form_class
        @form_url = update_object.form_url
      
        @model = update_object.load_existing_model params, pre_model
        @model_class = update_object.model_class
        unless fluxx_current_user.has_update_for_model?(@model || @model_class)
          p "ESH: fluxx_current_user has #{fluxx_current_user.inspect}"
          raise UnauthorizedException.new('update', (@model || @model_class)) 
        end
        @icon_style = update_object.icon_style
        instance_variable_set update_object.singular_model_instance_name, @model
        
        if update_object.editable? @model, fluxx_current_user
          update_result = update_object.perform_update params, @model, fluxx_current_user
          update_object.invoke_post self, @model
        
          if update_result
            response.headers['fluxx_result_success'] = 'update'
            flash[:info] = t(:insta_successful_update, :name => model_class.model_name.human) unless update_object.dont_display_flash_message
            insta_respond_to update_object, :success do |format|
              format.html do
                if update_object.render_inline 
                  render :inline => update_object.render_inline
                else
                  extra_options = {:id => @model.id}
                  head 201, :location => (update_object.redirect ? self.send(update_object.redirect, extra_options) : @model) 
                end
              end
              format.xml do
                head :ok
              end
            end
          else
            response.headers['fluxx_result_failure'] = 'update'
            flash[:error] = t(:errors_were_found) unless flash[:error]
            insta_respond_to update_object, :error do |format|
              logger.debug("Unable to save "+update_object.singular_model_instance_name.to_s+" with errors="+@model.errors.inspect)
              format.html { render((update_object.view || "#{insta_path}/edit").to_s, :layout => false) }
              # TODO ESH: revisit what to send back for JSON error
              format.json { head 500 }
              format.xml  { render :xml => @model.errors, :status => :unprocessable_entity }
            end
          end
        else
          response.headers['fluxx_result_failure'] = 'update'
          update_object.invoke_post self, @model
          flash[:error] = t(:record_is_locked, :name => (@model.locked_by ? @model.locked_by.to_s : ''), :lock_expiration => @model.locked_until.mdy_time)
          @not_editable=true
          insta_respond_to update_object, :locked do |format|
            # Provide a locked error message
            format.html { render((update_object.view || "#{insta_path}/edit").to_s, :layout => false) }
            # TODO ESH: revisit what to send back for JSON error
            format.json { head 500 }
            format.xml  { render :xml => @model.errors, :status => :unprocessable_entity }
          end
        end
      end
    end
  end

  def self.insta_delete model_class
    if respond_to?(:class_delete_object) && class_delete_object
      yield class_delete_object if block_given?
    else
      delete_object = ActionController::ControllerDslDelete.new(model_class)
      class_inheritable_reader :class_delete_object
      write_inheritable_attribute :class_delete_object, delete_object
      yield delete_object if block_given?

      define_method :insta_delete_object do
        delete_object
      end
    
      self.instance_eval do
        def insta_class_delete_object
          class_delete_object
        end
      end

      # DELETE /models/1
      # DELETE /models/1.xml
      define_method :destroy do
        delete_object.invoke_pre self

        @model = delete_object.load_existing_model params, pre_model
        @model_class = delete_object.model_class
        raise UnauthorizedException.new('delete', (@model || @model_class)) unless fluxx_current_user.has_delete_for_model?(@model || @model_class)
        @icon_style = delete_object.icon_style
        instance_variable_set delete_object.singular_model_instance_name, @model
        delete_result = delete_object.perform_delete params, @model, fluxx_current_user
        delete_object.invoke_post self, @model
        if delete_result
          response.headers['fluxx_result_success'] = 'delete'
          flash[:info] = t(:insta_successful_delete, :name => model_class.model_name.human) unless delete_object.dont_display_flash_message
          insta_respond_to delete_object, :success do |format|
            format.html do
              head 201, :location => ((delete_object.redirect ? self.send(delete_object.redirect) : nil) || url_for(@model))
            end
            format.xml  { head :ok }
          end
        else
          response.headers['fluxx_result_failure'] = 'delete'
          flash[:error] = t(:insta_unsuccessful_delete, :name => model_class.model_name.human) unless flash[:error]
          insta_respond_to delete_object, :error do |format|
            format.html do
              head 201, :location => ((delete_object.redirect ? self.send(delete_object.redirect) : nil) || url_for(@model))
            end
            format.xml  { head :ok }
          end
        end
      end
    end
  end
  
  def self.insta_related model_class
    if respond_to?(:class_related_object) && class_related_object
      yield class_related_object if block_given?
    else
      local_related_object = ActionController::ControllerDslRelated.new(model_class)
      class_inheritable_reader :class_related_object
      write_inheritable_attribute :class_related_object, local_related_object
      yield local_related_object if block_given?

      define_method :insta_related_object do
        local_related_object
      end
    
      self.instance_eval do
        def insta_class_related_object
          class_related_object
        end
      end

      define_method :load_related_data do |model|
        local_related_object.load_related_data self, model
      end
    end
  end

  def self.insta_report model_class=nil
    if respond_to?(:class_report_object) && class_report_object
      yield class_report_object if block_given?
    else
      local_report_object = ActionController::ControllerDslReport.new(self, model_class)
      class_inheritable_reader :class_report_object
      write_inheritable_attribute :class_report_object, local_report_object
      yield local_report_object if block_given?

      define_method :insta_report_object do
        local_report_object
      end
      
      define_method :insta_report_find_by_id do |report_id|
        class_report_object.reports.select{|rep| rep.report_id == report_id}.first
      end
    
      define_method :insta_report_list do
        class_report_object.reports
      end

      define_method :insta_show_report_list do
        class_report_object.reports.select{|rep| rep.class.is_show?}
      end

      define_method :insta_index_report_list do
        class_report_object.reports.select{|rep| rep.class.is_index?}
      end

      self.instance_eval do
        def insta_class_report_object
          class_report_object
        end
      end
    end
    
    class_report_object.instantiate_reports
  end
  
  def fluxx_current_user
    current_user if respond_to?(:current_user)
  end
  
  protected
  def insta_path
    "#{File.dirname(__FILE__).to_s}/../../../app/views/insta"
  end
  
  def add_headers filename, content_type
    if request.env['HTTP_USER_AGENT'] =~ /msie/i
      #this is required if you want this to work with IE
      headers['Pragma'] = 'public'
      headers["Content-type"] = "text/plain"
      headers['Cache-Control'] = 'no-cache, must-revalidate, post-check=0, pre-check=0'
      headers['Content-Disposition'] = "attachment; filename=\"#{filename}\""
      headers['Expires'] = "0"
    else
      headers["Content-Type"] ||= content_type
      headers["Content-Disposition"] = "attachment; filename=\"#{filename}\""
    end
  end

  def fluxx_show_card show_object, options
    @model_name = show_object.model_name unless @model_name
    @template = options[:template]
    @footer_template = options[:footer_template]
    # TODO ESH: chase down where exclude_related_data and layout comes from...
    @exclude_related_data = show_object.exclude_related_data
    @layout = options[:layout] || show_object.layout || 'printable_show'
    @layout = options[:layout] if !options[:layout].nil? # If options[:layout] is false, respect that
    render((show_object.view || "#{insta_path}/show").to_s, :layout => @layout)
  end
  
  def fluxx_edit_card edit_object, template_param=nil, form_class_param=nil, form_url_param=nil
    @template = template_param || edit_object.template
    @form_class = form_class_param || edit_object.form_class
    @form_url = form_url_param || edit_object.form_url
    render((edit_object.view || "#{insta_path}/edit").to_s, :layout => false)
  end
  
  def has_redirected_already?
    response.headers['Location']
  end
  
  # Find overridden format blocks and prefer those.  Pass in params of:
  #   * the controller_dsl object
  #   * outcome = :success, :locked, :error
  def insta_respond_to controller_dsl, outcome = :success
    unless has_redirected_already?
    
      if block_given?
        if @class_format_block_map
          yield @class_format_block_map if block_given?
        else
          @class_format_block_map = BlobStruct.new
          yield @class_format_block_map
        end
        cloned_controller_block_map = {}
        cloned_controller_block_map = controller_dsl.format_block_map.store.clone if controller_dsl.format_block_map && controller_dsl.format_block_map.store.is_a?(Hash)

        respond_to do |format|
          @class_format_block_map.store.keys.each do |key|
            if cloned_controller_block_map[key] && cloned_controller_block_map[key].is_a?(Proc)
              format.send key.to_sym do
                self.instance_exec([controller_dsl, outcome, @class_format_block_map.store[key]], &cloned_controller_block_map[key])
                cloned_controller_block_map.delete key
              end
            elsif @class_format_block_map.store[key] && @class_format_block_map.store[key].is_a?(Proc)
              format.send key.to_sym do
                @class_format_block_map.store[key].call
              end
            end
          end
          cloned_controller_block_map.keys.each do |key|
            if cloned_controller_block_map[key] && cloned_controller_block_map[key].is_a?(Proc)
              format.send key.to_sym do
                self.instance_exec([controller_dsl, outcome], &cloned_controller_block_map[key])
              end
            end
          end
        end
      end
    end
  end
end
