class ActionController::ReportDslPlot < ActionController::ReportDslShow
  def after_initialize
    self.template = 'insta/show/report_plot_template' unless self.template
    self.template_footer = 'insta/show/report_plot_template_footer' unless self.template_footer
    self.report_icon_style = 'style-modal-reports' unless self.report_icon_style
  end

  def calculate report, controller, models=nil
    params = controller.params
    report_vars = report.pre_compute(controller, self, params, models) if report.respond_to? :pre_compute
    report_data = report.compute_plot_data controller, self, params, report_vars, models if report.respond_to? :compute_plot_data
    report_filter_text = report.report_filter_text controller, self, params, report_vars, models if report.respond_to? :report_filter_text
    report_summary = report.report_summary controller, self, params, report_vars, models if report.respond_to? :report_summary
    report_legend = report.report_legend controller, self, params, report_vars, models if report.respond_to? :report_legend
    
    controller.send :instance_variable_set, "@report_vars", report_vars
    controller.send :instance_variable_set, "@icon_style", self.report_icon_style
    controller.send :instance_variable_set, "@report_label", self.generate_report_label(report)
    controller.send :instance_variable_set, "@report_data", report_data
    controller.send :instance_variable_set, "@report_filter_text", report_filter_text
    controller.send :instance_variable_set, "@report_summary", report_summary
    controller.send :instance_variable_set, "@report_legend", report_legend
  end
end