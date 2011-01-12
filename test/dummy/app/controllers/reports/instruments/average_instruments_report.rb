class AverageInstrumentsReport < ActionController::ReportBase
  set_type_as_index
  set_order 2
  def compute_index_plot_data controller, index_object, params, models
    [1, 2, 3, 4, 5]
  end
  
  def compute_index_excel_data controller, index_object, params, models
    [1, 2, 3, 4, 5]
  end
  
end
