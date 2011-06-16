require 'extensions/action_controller/excel_format_helper'

class ActionController::ControllerDslIndex < ActionController::ControllerDsl
  include FluxxEngine::ExcelFormatHelper

  # delta_type allows the user to override the model class name for the purposes of tracking realtime updates
  attr_accessor :delta_type
  # results per page; pagination default
  attr_accessor :results_per_page
  # any extra search conditions to be appended to the search string
  attr_accessor :search_conditions
  # sorting for the search
  attr_accessor :order_clause
  # any additional relationships to include
  attr_accessor :include_relation
  # any joins
  attr_accessor :joins
  # the view to display for the filter
  attr_accessor :filter_view
  # the optional title of the filter
  attr_accessor :filter_title
  # the optional filter template to provide the body of the filter form 
  attr_accessor :filter_template
  # If you don't want an anchor tag added to each model listing in the index, set this to true
  attr_accessor :suppress_model_anchor_tag
  # Normally the index.html template will iterate through the models and call the specified partial for each individual model.  If you set suppress_model_iteration to true, a var models will be passed to your partial instead.  This gives greater control to the partial to handle rendering the list.
  attr_accessor :suppress_model_iteration
  # Send the list of models to the supplied template and do not try to iterate through in the insta index.html.haml file
  attr_accessor :always_skip_wrapper
  

  # block to postprocess autocomplete results
  attr_accessor :postprocess_block
  
  ## Use ActionController::ControllerDslIndex.max_sphinx_results= to set a different value
  def self.max_sphinx_results= max_sphinx_results_param
    @max_sphinx_results = max_sphinx_results_param
  end
  
  def self.max_sphinx_results
    @max_sphinx_results || 500000
  end
  
  def load_results params, format=nil, models=nil, controller=nil
    if models
      models
    else 
      results_per_page = if (params[:all_results] && params[:all_results].to_i == 1) || (format && (format.csv? || format.xls?))
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
      
      extra_search_conditions = if self.search_conditions.is_a? Proc
        self.search_conditions.call params, self, controller
      else
        self.search_conditions
      end
      
      model_ids = if params[:find_by_id] && params[:id]
        id_results = model_class.where(:id => params[:id]).select(:id).all.map &:id
        WillPaginate::Collection.create 1, id_results.size, id_results.size do |pager|
          pager.replace id_results
        end
      else
        model_class.model_search(q_search, params, results_per_page, 
          {:search_conditions => extra_search_conditions, :order_clause => self.order_clause, :include_relation => include_relation, :joins => joins})
      end
      instance_variable_set @plural_model_instance_name, model_ids
      
      if format && (format.csv? || format.xls?)
        build_unpaged_models model_ids
      else
        model_class.page_by_ids model_ids
      end
    end
  end
  
  def build_unpaged_models model_ids
    unless model_csv_query.blank?
      unpaged_models = model_class.connection.execute(model_class.send(:sanitize_sql, ["select #{model_class.extract_base_class.name.tableize.singularize.downcase.pluralize}.id, #{model_csv_query}", model_ids]))
    else
      unpaged_models = model_class.find model_ids
    end
  end
  
  def model_csv_query 
    local_search_conditions = (self.search_conditions || {}).clone
    model_class.csv_sql_query local_search_conditions
  end
  
  def process_autocomplete models, name_method, controller
    formatting = if postprocess_block && postprocess_block.is_a?(Proc)
      postprocess_block.call models
    else
      unless name_method
        name_method = if model_class.public_instance_methods.include?('autocomplete_to_s')
          :autocomplete_to_s
        elsif model_class.public_instance_methods.include?('view_to_s')
          :view_to_s
        elsif model_class.public_instance_methods.include?('value')
          :value
        elsif model_class.public_instance_methods.include?('name')
          :name
        else
          :to_s
        end
      end
      models.map do |model|
        {:label => model.send(name_method), :value => model.id, :url => controller.url_for(model)}
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
        headers = extract_headers(headers, unpaged_models).map do |header_record| 
          if header_record.is_a?(Array)
            header_record.first
          else
            header_record
          end
        end
        
        csv << headers
        
        unless model_csv_query.blank?
          (1..extract_number_of_records(unpaged_models)).each do |offset|
            cur_row = extract_row(unpaged_models, offset)
            csv << cur_row
          end
        else
          ordered_headers = model_class.columns.map(&:name).sort
          unpaged_models.each do |element|
            csv << ordered_headers.map {|header| element.send header}
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

  def extract_headers headers, unpaged_models
    unpaged_models.is_a?(Array) ? model_class.columns.map(&:name) : headers
  end
  
  def extract_number_of_records unpaged_models
    unpaged_models.is_a?(Array) ? unpaged_models.size : unpaged_models.num_rows
  end
  
  def extract_row unpaged_models, offset, headers
    if unpaged_models.is_a?(Array)
      cur_row = unpaged_models[offset]
      headers.map { |header| cur_row.attributes[header] }
    else
      cur_row = unpaged_models.fetch_row
      cur_row[1, cur_row.size-1]
    end
  end

  def extract_column_format_name(model_klass, column)
    if model_klass and column_definition = model_klass.columns_hash[column]
      column_definition.type
    else
      column.is_a?(Array) ? column.last : :string
    end
  end
  
  # Based on formatting tips in http://forums.asp.net/t/1038105.aspx
  # Useful reference: http://msdn.microsoft.com/en-us/library/aa140066(office.10).aspx
  # More reference: http://support.microsoft.com/kb/319180
  # TODO ESH: generalize a bit and consider contributing to open source as a separate plugin with an API similar to faster_csv
  def stream_xls request, request_headers, filename, extract_type, headers, unpaged_models, model_class
    add_headers(request, request_headers, filename, extract_type)

    output = StringIO.new
    workbook = WriteExcel.new(output)
    worksheet = workbook.add_worksheet
    ordered_headers = extract_headers(headers, unpaged_models).to_a
    model_klass = unpaged_models.is_a?(Array) && !unpaged_models.empty? ? unpaged_models.first.class : nil

    non_wrap_bold_format, bold_format, header_format, solid_black_format, amount_format, number_format, date_format, text_format, header_format, 
    sub_total_format, sub_total_border_format, total_format, total_border_format, final_total_format, final_total_border_format, 
    bold_total_format, double_total_format = build_formats(workbook)
    
    currency_format = decimal_format = amount_format
    datetime_format = timestamp_format = date_format
    string_format = text_format
    ingeger_format = float_format = number_format

    row = 0

    ordered_headers.each_with_index { |header, index|
      header = header.is_a?(Array) ? header.first : header
      worksheet.write(row, index, header.to_s.humanize, header_format)
    }

    extract_number_of_records(unpaged_models).times { |offset|
      row += 1
      attributes = extract_row(unpaged_models, offset, ordered_headers)

      ordered_headers.each_with_index { |attr,i|
        format_name = extract_column_format_name(model_klass, attr)
        format = eval("#{format_name}_format") rescue format = string_format
        worksheet.write(row, i, attributes[i], format) 
      }
    }

    workbook.close
    output.string
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
