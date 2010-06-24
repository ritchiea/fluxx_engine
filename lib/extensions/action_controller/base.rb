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
  
  def self.insta_auto_complete model_class
    autocomplete_object = ActionController::ControllerDslAutocomplete.new model_class
    yield autocomplete_object if block_given?
    define_method :auto_complete do
      render :inline => autocomplete_object.process_autocomplete(params)
    end
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
      @delta_type = if index_object.delta_type
        index_object.delta_type
      else
        model_class.name
      end
      
      @template = index_object.template
      @models = index_object.load_results params, request.format
      instance_variable_set index_object.plural_model_instance_name, @models
      
      respond_to do |format|
        format.html { render((index_object.view || "#{insta_path}/index").to_s, :layout => false) }
        format.xml  { render :xml => instance_variables[@plural_model_instance_name] }
        format.xls do
          stream_extract model_class, @models, index_object.search_conditions, :xls
        end
        format.csv do
          stream_extract model_class, @models, index_object.search_conditions, :csv
        end
      end
    end
  end
  
  def self.insta_show model_class
    show_object = ActionController::ControllerDslShow.new model_class
    yield show_object if block_given?

    # GET /models/1
    # GET /models/1.xml
    define_method :show do
      @model = show_object.perform_show params
      @model_name = show_object.model_name
      respond_to do |format|
        format.html do 
          if @model
            fluxx_show_card show_object, show_object.calculate_show_options(params)
          else
            render :inline => show_object.calculate_error_options(params)
          end
        end
        format.xml  { render :xml => @model }
      end
    end
  end

  def self.insta_new model_class, options={}
    new_object = ActionController::ControllerDslNew.new model_class
    yield new_object if block_given?

    # GET /models/new
    # GET /models/new.xml
    define_method :new do
      @model = new_object.load_new_model params, @model
      
      instance_variable_set new_object.singular_model_instance_name, @model
      @template = new_object.template
      @form_class = new_object.form_class
      @form_url = new_object.form_url
      respond_to do |format|
        format.html { render((new_object.view || "#{insta_path}/new").to_s, :layout => false)}
        format.xml  { render :xml => @model }
      end
    end
  end

  def self.insta_edit model_class
    edit_object = ActionController::ControllerDslEdit.new model_class
    yield edit_object if block_given?

    # GET /models/1/edit
    define_method :edit do
      respond_to do |format|
        @model = edit_object.perform_edit params, @model
        unless edit_object.editable? @model, fluxx_current_user
          # Provide a locked error message
          flash[:error] = t(:record_is_locked, :name => (@model.locked_by ? @model.locked_by.full_name : ''), :lock_expiration => @model.locked_until.mdy_time)
          @not_editable=true
        end
        format.html { fluxx_edit_card edit_object }
      end
    end
  end

  def self.insta_post model_class
    create_object = ActionController::ControllerDslCreate.new model_class
    yield create_object if block_given?

    # POST /models
    # POST /models.xml
    define_method :create do
      @model = create_object.load_new_model params, @model
      instance_variable_set create_object.singular_model_instance_name, @model
      @template = create_object.template
      @form_class = create_object.form_class
      @form_url = create_object.form_url
      @link_to_method = create_object.link_to_method
      if create_object.perform_create params, @model, fluxx_current_user
        respond_to do |format|
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
        respond_to do |format|
          p "ESH: error saving record #{@model.errors.inspect}"
          flash[:error] = t(:errors_were_found)
          logger.debug("Unable to create "+create_object.singular_model_instance_name.to_s+" with errors="+@model.errors.inspect)
          format.html { render((create_object.view || "#{insta_path}/new").to_s, :layout => false) }
          format.xml  { render :xml => @model.errors, :status => :unprocessable_entity }
        end
      end
    end
  end

  def self.insta_put model_class
    update_object = ActionController::ControllerDslUpdate.new model_class
    yield update_object if block_given?

    # PUT /models/1
    # PUT /models/1.xml
    define_method :update do
      @template = update_object.template
      @form_class = update_object.form_class
      @form_url = update_object.form_url
      
      @model = update_object.load_existing_model params, @model
      instance_variable_set update_object.singular_model_instance_name, @model

      if update_object.editable? @model, fluxx_current_user
        respond_to do |format|
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
        respond_to do |format|
          # Provide a locked error message
          flash[:error] = t(:record_is_locked, :name => (@model.locked_by ? @model.locked_by.full_name : ''), :lock_expiration => @model.locked_until.mdy_time)
          format.html { render((update_object.view || "#{insta_path}/edit").to_s, :layout => false) }
          format.xml  { render :xml => @model.errors, :status => :unprocessable_entity }
          @not_editable=true
        end
      end
    end
  end

  def self.insta_delete model_class
    delete_object = ActionController::ControllerDslDelete.new model_class
    yield delete_object if block_given?

    # DELETE /models/1
    # DELETE /models/1.xml
    define_method :destroy do
      @model = delete_object.load_existing_model params, @model
      instance_variable_set delete_object.singular_model_instance_name, @model
      if delete_object.perform_delete params, @model, fluxx_current_user
        flash[:info] = t(:insta_successful_delete, :name => model_class.name)
      else
        flash[:error] = t(:insta_unsuccessful_delete, :name => model_class.name)
      end

      respond_to do |format|
        format.html { redirect_to((delete_object.redirect ? self.send(delete_object.redirect): nil) || "#{model_class.name.underscore.downcase}_path") }
        format.xml  { head :ok }
      end
    end
  end

  
  def stream_extract model_class, unpaged_models, search_conditions, extract_type
    csv_filename = model_class.csv_filename(search_conditions)
    csv_filename = 'file' if csv_filename.blank?
    filename = 'fluxx_' + csv_filename + '_' + Time.now.strftime("%m%d%y") + ".#{extract_type.to_s}"
    
    headers = model_class.csv_headers(search_conditions)
    if extract_type == :xls
      stream_xls filename, extract_type, headers, unpaged_models, model_class
    else
      stream_csv( filename, extract_type ) do |csv|
        headers = headers.map do |header_record| 
          if header_record.is_a?(Array)
            header_record.first
          else
            header_record
          end
        end
        
        csv << headers
        
        if unpaged_models.is_a?(Array) 
          ordered_headers = model_class.columns.map(&:name).sort
          unpaged_models.each do |element|
            csv << ordered_headers.map {|header| element.send header}
          end
        else
          (1..unpaged_models.num_rows).each do
            csv << unpaged_models.fetch_row
          end
        end
      end
    end
  end
  
  def insta_path
    "#{File.dirname(__FILE__).to_s}/../../../app/views/insta"
  end
  
  def fluxx_show_card show_object, options
    @template = options[:template]
    @footer_template = options[:footer_template]
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
  
  def stream_csv filename = (params[:action] + ".csv"), extract_type = :csv
    add_headers filename, extract_type
    
    # NOTE ESH: render :text => Proc is currently broken in rails 3.  See Template::Text and https://rails.lighthouseapp.com/projects/8994-ruby-on-rails/tickets?q=render+text
    csv_processor = (lambda do |response, output|
      def output.<<(*args)  
        write(*args)  
      end  
      csv = FasterCSV.new(output, :row_sep => "\r\n")
      yield csv
    end)
    
    io = StringIO.new
    csv_processor.call nil, io
    self.response_body = io.string
  end
  
  # Based on formatting tips in http://forums.asp.net/t/1038105.aspx
  # Useful reference: http://msdn.microsoft.com/en-us/library/aa140066(office.10).aspx
  # More reference: http://support.microsoft.com/kb/319180
  # TODO ESH: generalize a bit and consider contributing to open source as a separate plugin with an API similar to faster_csv
  def stream_xls filename, extract_type, headers, unpaged_models, model_class
    add_headers filename, extract_type
    
    # NOTE ESH: render :text => Proc is currently broken in rails 3.  See Template::Text and https://rails.lighthouseapp.com/projects/8994-ruby-on-rails/tickets?q=render+text
    xls_processor = (lambda do |response, output|
      # NOTE ESH: be careful to htmlescape quotes with ss:Format strings
      output.write '<?xml version="1.0" encoding="UTF-8"?>
      <Workbook xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40" xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office">
      <Styles>
        <Style ss:ID="s21"><Font x:Family="Swiss" ss:Bold="1"/></Style>
        <Style ss:ID="s22"><NumberFormat ss:Format="Short Date"/><Font x:Family="Swiss" ss:Bold="0"/></Style>
        <Style ss:ID="s18"><NumberFormat ss:Format="_(&quot;$&quot;* #,##0.00_);_(&quot;$&quot;* \(#,##0.00\);_(&quot;$&quot;* &quot;-&quot;??_);_(@_)"/><Font x:Family="Swiss" ss:Bold="0"/></Style>
      </Styles>
      <Worksheet ss:Name="Sheet1">
      <Table>'
      
      if headers
        output.write "<Row>"
        headers.each do |header_record| 
          header = if header_record.is_a?(Array)
            header_record.first
          else
            header_record
          end
          output.write "<Cell ss:StyleID=\"s21\"><Data ss:Type=\"String\">#{header}</Data></Cell>" 
        end
        output.write "</Row>"
      end    
      ordered_headers = model_class.columns.map(&:name).sort

      if unpaged_models.is_a? Array
        unpaged_models.each do |element|
          output.write "<Row>"
          generate_xls_row ordered_headers.map {|header| element.send header}, output
          output.write "</Row>"
        end
      else
        (1..unpaged_models.num_rows).each do
          output.write "<Row>"
          generate_xls_row unpaged_models.fetch_row, output
          output.write "</Row>"
        end
      end

      output.write '</Table></Worksheet></Workbook>'
    end)

    io = StringIO.new
    xls_processor.call nil, io
    self.response_body = io.string
  end
  
  def generate_xls_row columns, output
    columns.each_with_index do |value, i|
      val_type = if headers[i].is_a?(Array)
        headers[i].second
      end || 'String'
      ss_style = ''
      val_type = case val_type
      when :date
        # "mso-number-format:\"mm\/dd\/yy\""
        cur_date = Time.parse value rescue nil
        value = if cur_date && cur_date > Time.now - 200.years
          cur_date.msoft 
        else
          ''
        end
        ss_style = 'ss:StyleID="s22"'
        "DateTime"
      when :currency
        ss_style = 'ss:StyleID="s18"'
        "Number"
      when :integer
        "Number"
      else
        'String'
      end
      if value.blank? || value.nil?
        output.write "<Cell><Data ss:Type=\"String\"/></Cell>"
      else
        output.write "<Cell #{ss_style}><Data ss:Type=\"#{val_type.to_s}\">#{CGI::escapeHTML(value.to_s)}</Data></Cell>"
      end
    end
    
  end

  def add_headers filename, extract_type = :csv
    if request.env['HTTP_USER_AGENT'] =~ /msie/i
      #this is required if you want this to work with IE
     headers['Pragma'] = 'public'
     headers["Content-type"] = "text/plain"
     headers['Cache-Control'] = 'no-cache, must-revalidate, post-check=0, pre-check=0'
     headers['Content-Disposition'] = "attachment; filename=\"#{filename}\""
     headers['Expires'] = "0"
    else
      if extract_type == :xls
        headers["Content-Type"] ||= 'application/vnd.ms-excel'
      else
        headers["Content-Type"] ||= 'text/csv'
      end
      headers["Content-Disposition"] = "attachment; filename=\"#{filename}\""
    end
  end
  
end