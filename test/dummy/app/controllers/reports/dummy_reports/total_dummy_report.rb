class TotalDummyReport < ActionController::ReportBase
  set_type_as_show
  set_order 1

  def initialize report_id
    super report_id
    self.filter_template = 'dummy_reports/total_dummy_report_filter'
  end
  
  def compute_show_plot_data controller, show_object, params, report_vars
    [1, 2, 3, 4]
  end
  
  def compute_show_document_headers controller, show_object, params, report_vars
    ['filename', 'excel']
  end
  
  def compute_show_document_data controller, show_object, params, report_vars
    "A total dummy show document"
  end
  
  def report_filter_text controller, show_object, params, report_vars
  end
  
  def report_summary controller, show_object, params, report_vars
  end
  
  def report_legend controller, show_object, params, report_vars
    [{}]
  end
  
end
