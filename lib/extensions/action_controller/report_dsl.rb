class ActionController::ReportDsl
  # unique identifier for this report
  attr_accessor :report_id
  # label for this report
  attr_accessor :report_label
  # description for this report
  attr_accessor :report_description
  # filter text for this report
  attr_accessor :report_filter_text
  # report type; list or show
  attr_accessor :report_type
  # report order; numerical ordering of the report
  attr_accessor :report_order
  # template path for rendering the filter; nil would suggest that there is no filter to be supplied
  attr_accessor :filter_template
  # optional block to build a summary for this report
  attr_accessor :report_summary_block
  # icon style
  attr_accessor :report_icon_style
  # indicates whether to display the report in the list or not
  attr_accessor :report_visible_block
  
  def initialize model_class
    @model_klass = model_class
    after_initialize
  end
  
  def visible? report
    if report_visible_block
      report_visible_block.call(report, self)
    else
      true
    end
  end
  
  def after_initialize
    # hook 
  end
  
  def generate_report_label report
    if report_label.is_a?(Proc)
      report_label.call report, self
    else
      report_label
    end
  end
  
  def add_summary_block &block
    self.report_summary_block = block
  end
  
  def is_show?
    report_type == :show
  end

  def is_index?
    report_type == :index
  end
  
  def render_summary options={}
    if report_summary_block
      report_summary_block.call options
    end
  end
end