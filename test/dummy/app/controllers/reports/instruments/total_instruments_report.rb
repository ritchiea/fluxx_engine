class TotalInstrumentsReport < ActionController::ReportBase
  set_type_as_show
  set_order 1
  def compute_show_plot_data controller, index_object, params
    [1, 2, 3, 4]
  end
  
  def compute_show_excel_data controller, index_object, params
    [1, 2, 3, 4, 5]
  end
end
