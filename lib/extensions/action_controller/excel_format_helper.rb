module FluxxEngine
  module ExcelFormatHelper
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

      [ non_wrap_bold_format, bold_format, header_format, solid_black_format, amount_format, number_format, date_format, text_format, header_format, 
        sub_total_format, sub_total_border_format, total_format, total_border_format, final_total_format, final_total_border_format, bold_total_format, double_total_format ]
    end    
  end
end
