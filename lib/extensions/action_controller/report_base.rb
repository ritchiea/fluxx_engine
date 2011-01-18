require 'writeexcel'
class ActionController::ReportBase
  # unique identifier for this report
  attr_accessor :report_id
  # label for this report
  attr_accessor :report_label
  # description for this report
  attr_accessor :report_description
  # report type; list or show
  attr_accessor :report_type
  # template path for rendering the page that displays the plot; nil will just use the default
  attr_accessor :plot_template
  # template path for rendering the filter; nil would suggest that there is no filter to be supplied
  attr_accessor :filter_template
  # footer template path for rendering the report footer; nil will just use the default
  attr_accessor :plot_template_footer

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
  
  def self.has_plot?
    self.is_show? && self.respond_to?(:compute_show_plot_data) ||
      self.is_index? && self.respond_to?(:compute_index_plot_data)
  end
  def self.has_document?
    self.is_show? && self.respond_to?(:compute_show_document_data) && self.respond_to?(:compute_show_document_headers) ||
      self.is_index? && self.respond_to?(:compute_index_document_data) && self.respond_to?(:compute_index_document_headers)
  end
  
  # implement methods such as:
  # INDEX:
  # compute_index_plot_data controller, index_object, params, models
  #   * should return a string that contains JSON, etc. to render and be used to draw the chart
  # compute_index_document_headers controller, index_object, params, models
  #   * should return an array of the [filename, content-type]
  # compute_index_document_data controller, index_object, params, models
  #   * should return a string that contains the document to be sent to the browser
  # OR SHOW:
  # compute_show_plot_data controller, index_object, params
  #   * should return a string that contains JSON, etc. to render and be used to draw the chart
  # compute_show_document_headers controller, index_object, params, models
  #   * should return an array of the [filename, content-type]
  # compute_show_document_data controller, index_object, params
  #   * should return a string that contains the document to be sent to the browser
  # BUT NOT BOTH
  

end
