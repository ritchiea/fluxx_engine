class ActiveRecord::ModelDslExport < ActiveRecord::ModelDsl
  # A custom SQL query to be executed when the export is run
  attr_accessor :sql_query
  # A list of headers to be coupled with the results of executing the sql query
  attr_accessor :headers
  # The name of the file to be exported
  attr_accessor :filename
  # Custom spreadsheet view template
  attr_accessor :spreadsheet_template
  attr_accessor :spreadsheet_cells
  
  def csv_sql_query with_clause=nil
    sql_query.is_a?(Proc) ? (sql_query.call with_clause) : sql_query
  end

  def csv_headers with_clause=nil
    if headers.is_a?(Proc)
      (headers.call with_clause)
    elsif !headers || headers.blank? 
      model_class.columns.reject{|col| col.name.to_s == 'client_id'}.map(&:name).sort
    else
      headers
    end
  end
  
  def csv_filename with_clause=nil
    filename.is_a?(Proc) ? (filename.call with_clause) : filename
  end

  def spreadsheet_row_data with_clause=nil
    spreadsheet_cells.is_a?(Proc) ? (spreadsheet_cells.call with_clause) : spreadsheet_cells
  end
end