class TotalDummyReport < ActionController::ReportBase
  set_type_as_show
  set_order 1

  def initialize report_id
    super report_id
    self.filter_template = 'dummy_reports/total_dummy_report_filter'
  end
  
  def compute_show_plot_data controller, show_object, params
    [1, 2, 3, 4]
  end
  
  def compute_show_excel_data controller, show_object, params
    [1, 2, 3, 4, 5]
  end
end
