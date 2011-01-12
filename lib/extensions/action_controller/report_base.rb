class ActionController::ReportBase
  # unique identifier for this report
  attr_accessor :report_id
  # label for this report
  attr_accessor :report_label
  # report type; list or show
  attr_accessor :report_type
  # template path for rendering the page that displays the plot; nil will just use the default
  attr_accessor :plot_template
  # footer template path for rendering the report footer; nil will just use the default
  attr_accessor :plot_template_footer
  
  # TODO ESH: add support for a custom filter screen
  
  def initialize report_id
    self.report_id = report_id
  end
  
  def self.set_type_as_show
    @report_type = :show
  end

  def self.set_type_as_index
    @report_type = :index
  end
  
  def self.set_order order
    @order = order
  end
  
  def self.get_order
    @order
  end
  
  def self.is_show?
    @report_type == :show
  end
  
  def self.is_index?
    @report_type == :index
  end
  
  def compute_index_plot_data controller, index_object, params, models
    raise Exception.new 'Not implemented; if your report handles index plot data, please override'
  end
  
  def compute_index_excel_data controller, index_object, params, models
    raise Exception.new 'Not implemented; if your report handles index excel data, please override'
  end
  
  def compute_show_plot_data controller, index_object, params
    raise Exception.new 'Not implemented; if your report handles show plot data, please override'
  end
  
  def compute_show_excel_data controller, index_object, params
    raise Exception.new 'Not implemented; if your report handles show excel data, please override'
  end
end
