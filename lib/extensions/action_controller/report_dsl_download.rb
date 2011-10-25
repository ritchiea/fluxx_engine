class ActionController::ReportDslDownload < ActionController::ReportDsl
  # specify the extension (.pdf, .gif, .txt, etc.) for the download file
  attr_accessor :format_extension
  
  def calculate report, controller, models=nil
    params = controller.params
    report_vars = report.pre_compute(controller, self, params, models) if report.respond_to? :pre_compute
    controller.send :instance_variable_set, '@report_vars', report_vars
    headers = report.compute_document_headers self, self, params, report_vars, models
    controller.send :add_headers, headers[0], headers[1]
    report.compute_document_data controller, self, params, report_vars, models
  end
end