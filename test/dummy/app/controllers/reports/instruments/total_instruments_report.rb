class TotalInstrumentsReport < ActionController::ReportBase
  insta_report(:plot) do |insta|
    insta.filter_template = 'instruments/total_instruments_report_filter'
    insta.report_order = 1
  end

  def compute_plot_data controller, index_object, params, report_vars, models
    [1, 2, 3, 4]
  end
  
  def compute_document_headers controller, index_object, params, report_vars, models
    ['filename', 'excel']
  end
  
  def compute_document_data controller, index_object, params, report_vars, models
    "A total instruments index document"
  end
  
end
