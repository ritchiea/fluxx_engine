class ActionController::ReportDslShow < ActionController::ReportDsl
  # main template to display
  attr_accessor :template
  # footer template to display
  attr_accessor :template_footer
  
  def after_initialize
    self.template = 'insta/show/report_template' unless self.template
    self.template_footer = 'insta/show/report_template_footer' unless self.template_footer
  end
end