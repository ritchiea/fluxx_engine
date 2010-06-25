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


  # block to postprocess autocomplete results
  attr_accessor :postprocess_block
  
  ## Use ActionController::ControllerDslIndex.max_sphinx_results= to set a different value
  def self.max_sphinx_results= max_sphinx_results_param
    @max_sphinx_results = max_sphinx_results_param
  end
  
  def self.max_sphinx_results
    @max_sphinx_results || 500000
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
    elsif params[:term]
      params[:term]
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
  
  def process_autocomplete models
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
  
  def stream_extract request, request_headers, unpaged_models, search_conditions, extract_type
    csv_filename = model_class.csv_filename(search_conditions)
    csv_filename = 'file' if csv_filename.blank?
    filename = 'fluxx_' + csv_filename + '_' + Time.now.strftime("%m%d%y") + ".#{extract_type.to_s}"
    
    headers = model_class.csv_headers(search_conditions)
    if extract_type == :xls
      stream_xls request, request_headers, filename, extract_type, headers, unpaged_models, model_class
    else
      stream_csv( request, request_headers, filename, extract_type ) do |csv|
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
  
  def stream_csv request, headers, filename = (params[:action] + ".csv"), extract_type = :csv
    add_headers request, headers, filename, extract_type
    
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
    io.string
  end
  
  # Based on formatting tips in http://forums.asp.net/t/1038105.aspx
  # Useful reference: http://msdn.microsoft.com/en-us/library/aa140066(office.10).aspx
  # More reference: http://support.microsoft.com/kb/319180
  # TODO ESH: generalize a bit and consider contributing to open source as a separate plugin with an API similar to faster_csv
  def stream_xls request, request_headers, filename, extract_type, headers, unpaged_models, model_class
    add_headers request, request_headers, filename, extract_type
    
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
          generate_xls_row ordered_headers.map {|header| element.send header}, output, ordered_headers
          output.write "</Row>"
        end
      else
        (1..unpaged_models.num_rows).each do
          output.write "<Row>"
          generate_xls_row unpaged_models.fetch_row, output, ordered_headers
          output.write "</Row>"
        end
      end

      output.write '</Table></Worksheet></Workbook>'
    end)

    io = StringIO.new
    xls_processor.call nil, io
    io.string
  end
  
  def generate_xls_row columns, output, headers
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

  def add_headers request, headers, filename, extract_type = :csv
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