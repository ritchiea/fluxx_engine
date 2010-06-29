class ActiveRecord::ModelDslExport < ActiveRecord::ModelDsl
  # A custom SQL query to be executed when the export is run
  attr_accessor :sql_query
  # A list of headers to be coupled with the results of executing the sql query
  attr_accessor :headers
  # The name of the file to be exported
  attr_accessor :base_filename
  
  def csv_sql_query with_clause
    sql_query.is_a?(Proc) ? (sql_query.call with_clause) : sql_query
  end

  def csv_headers with_clause
    if headers.is_a?(Proc)
      (headers.call with_clause)
    elsif headers.blank?
      headers = model_class.columns.map(&:name).sort
    else
      headers
    end
  end
  
  def csv_filename with_clause
    base_filename.is_a?(Proc) ? (base_filename.call with_clause) : base_filename
  end
end