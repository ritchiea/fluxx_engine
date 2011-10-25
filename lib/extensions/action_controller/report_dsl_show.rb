class ActionController::ReportDslShow < ActionController::ReportDsl
  # main template to display
  attr_accessor :template
  # footer template to display
  attr_accessor :template_footer
  
  def after_initialize
    self.template = 'insta/show/report_template' unless self.template
    self.report_icon_style = 'style-modal-reports' unless self.report_icon_style
  end
  
  def calculate report, controller, models=nil
    params = controller.params
    report_vars = report.pre_compute(controller, self, params, models) if report.respond_to? :pre_compute
    report_data = report.compute_document_data controller, self, params, report_vars, models
    
    controller.send :instance_variable_set, "@report_vars", report_vars
    controller.send :instance_variable_set, "@report_data", report_data
  end
  
end