class TotalInstrumentsReport < ActionController::ReportBase
  set_type_as_index
  set_order 1

  def initialize report_id
    super report_id
    self.filter_template = 'instruments/total_instruments_report_filter'
  end
  
  def compute_index_plot_data controller, index_object, params, models
    [1, 2, 3, 4]
  end
  
  def compute_index_excel_data controller, index_object, params, models
    [1, 2, 3, 4, 5]
  end
end
