require 'writeexcel'
class ActionController::ReportBase
  include ActionView::Helpers::NumberHelper

  def initialize report_id
    @report_id = report_id
    self.class.class_report_object.report_id = @report_id 
  end
  
  # Note that you can call insta_report multiple times, but you have to choose just one report_type; that determines the type of object returned.
  # Subsequent calls will simply return the already instantiated object
  def self.insta_report report_type
    if respond_to?(:class_report_object) && class_report_object
      yield class_report_object if block_given?
    else
      local_report_object = case report_type.to_sym
      when :plot
        ActionController::ReportDslPlot.new(self)
      when :show
        ActionController::ReportDslShow.new(self)
      when :download
        ActionController::ReportDslDownload.new(self)
      else
        raise Exception.new "Unrecognized report_type #{report_type}"
      end
      
      class_inheritable_reader :class_report_object
      write_inheritable_attribute :class_report_object, local_report_object
      yield local_report_object if block_given?
    end
  end


  def is_download?
    local_configuration.is_a?(ActionController::ReportDslDownload)
  end
  
  def is_show?
    local_configuration.is_a?(ActionController::ReportDslShow)
  end
  
  def is_plot?
    local_configuration.is_a?(ActionController::ReportDslPlot)
  end
  
  def template
    local_configuration.template if local_configuration.respond_to? :template
  end
  
  def footer_template
    local_configuration.template_footer if local_configuration.respond_to? :template_footer
  end
  
  def self.configuration
    class_report_object
  end
  
  def local_configuration
    self.class.class_report_object
  end
  
  def format_extension
    local_configuration.format_extension if local_configuration.respond_to?(:format_extension)
  end
  
  def report_id
    local_configuration.report_id
  end
  
  def calculate controller, models=nil
    local_configuration.calculate self, controller, models
  end
  
  def report_label
    local_configuration.generate_report_label self
  end
  
  def visible?
    local_configuration.visible? self
  end
  
  def filter_template
    local_configuration.filter_template
  end
  
  def report_description
    local_configuration.report_description
  end

  # Common utility methods
  # TODO ESH: consider moving into a module so we don't have to rely on inheritance for this; plus many classes don't need excel methods
  def build_formats workbook
    # Set up some basic formats:
    non_wrap_bold_format = workbook.add_format()
    non_wrap_bold_format.set_bold()
    non_wrap_bold_format.set_valign('top')
    bold_format = workbook.add_format()
    bold_format.set_bold()
    bold_format.set_align('center')
    bold_format.set_valign('top')
    bold_format.set_text_wrap()
    header_format = workbook.add_format()
    header_format.set_bold()
    header_format.set_bottom(1)
    header_format.set_align('top')
    header_format.set_text_wrap()
    solid_black_format = workbook.add_format()
    solid_black_format.set_bg_color('black')
    amount_format = workbook.add_format()
    amount_format.set_num_format("#{I18n.t 'number.currency.format.unit'}#,##0")
    amount_format.set_valign('bottom')
    amount_format.set_text_wrap()
    number_format = workbook.add_format()
    number_format.set_num_format(0x01)
    number_format.set_valign('bottom')
    number_format.set_text_wrap()
    date_format = workbook.add_format()
    date_format.set_num_format(15)
    date_format.set_valign('bottom')
    date_format.set_text_wrap()
    text_format = workbook.add_format()
    text_format.set_valign('top')
    text_format.set_text_wrap()
    
    bold_total_format = workbook.add_format()
    bold_total_format.set_bold()
    bold_total_format.set_top(2)
    bold_total_format.set_num_format(0x03)
    
    double_total_format = workbook.add_format()
    double_total_format.set_bold()
    double_total_format.set_top(6)
    double_total_format.set_num_format(0x03)
    
    header_format = workbook.add_format(
      :bold => 1,
      :color => 9,
      :bg_color => 8)
    workbook.set_custom_color(40, 214, 214, 214)
    sub_total_format = workbook.add_format(
      :bold => 1,
      :color => 8,
      :bg_color => 40)
    sub_total_border_format = workbook.add_format(
       :top => 1,
       :bold => 1,
       :num_format => "#{I18n.t 'number.currency.format.unit'}#,##0",
       :color => 8,      
       :bg_color => 40)      
    total_format = workbook.add_format(
      :bold => 1,
      :color => 8,
      :bg_color => 22)
    total_border_format = workbook.add_format(
      :top => 1,
      :bold => 1,
      :num_format => "#{I18n.t 'number.currency.format.unit'}#,##0",
      :color => 8,
      :bg_color => 22)
    workbook.set_custom_color(41, 128, 128, 128)      
    final_total_format = workbook.add_format(
      :bold => 1,
      :color => 8,
      :bg_color => 41)
    final_total_border_format = workbook.add_format(
      :top => 1,
      :bold => 1,
      :num_format => "#{I18n.t 'number.currency.format.unit'}#,##0",
      :color => 8,
      :bg_color => 41)
    [non_wrap_bold_format, bold_format, header_format, solid_black_format, amount_format, number_format, date_format, text_format, header_format, 
        sub_total_format, sub_total_border_format, total_format, total_border_format, final_total_format, final_total_border_format, bold_total_format, double_total_format
    ]
  end
  
  def calculate_column_letters
    # Calculate letter combinations for column names for the sake of formulas; A, B, C, .. Z, AB, AC, ... ZZ
    column_letters = ('A'..'Z').to_a
    column_letters = column_letters + column_letters.map {|letter1| column_letters.map {|letter2| letter1 + letter2 } }
    column_letters.flatten
  end
  
  # implement methods such as:
  # INDEX:
  # compute_index_plot_data controller, index_object, params, models, report_vars
  #   * should return a string that contains JSON, etc. to render and be used to draw the chart
  # compute_index_document_headers controller, index_object, params, models, report_vars
  #   * should return an array of the [filename, content-type]
  # compute_index_document_data controller, index_object, params, models, report_vars
  #   * should return a string that contains the document to be sent to the browser
  # OR SHOW:
  # compute_show_plot_data controller, index_object, params, report_vars
  #   * should return a string that contains JSON, etc. to render and be used to draw the chart
  # compute_show_document_headers controller, index_object, params, models, report_vars
  #   * should return an array of the [filename, content-type]
  # compute_show_document_data controller, index_object, params, report_vars
  #   * should return a string that contains the document to be sent to the browser
  # BUT NOT BOTH


end
