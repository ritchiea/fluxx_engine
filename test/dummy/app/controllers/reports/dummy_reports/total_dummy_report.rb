require 'action_controller'
class TotalDummyReport < ActionController::ReportBase
  insta_report(:plot) do |insta|
    insta.filter_template = 'dummy_reports/total_dummy_report_filter'
    insta.report_order = 1
  end

  def compute_plot_data controller, show_object, params, report_vars, models
    [1, 2, 3, 4]
  end
  
  def compute_document_headers controller, show_object, params, report_vars, models
    ['filename', 'excel']
  end
  
  def compute_document_data controller, show_object, params, report_vars, models
    "A total dummy show document"
  end
  
  def report_filter_text controller, show_object, params, report_vars, models
  end
  
  def report_summary controller, show_object, params, report_vars, models
  end
  
  def report_legend controller, show_object, params, report_vars, models
    [{}]
  end
  
end
