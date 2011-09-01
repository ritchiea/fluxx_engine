class AverageInstrumentsReport < ActionController::ReportBase
  set_type_as_index
  set_order 2
  def compute_index_plot_data controller, index_object, params, models, report_vars
    [1, 2, 3, 4, 5]
  end
  
  def compute_index_document_headers controller, index_object, params, models, report_vars
    ['filename', 'excel']
  end
  
  def compute_index_document_data controller, index_object, params, models, report_vars
    "An average instruments index document"
  end
end
