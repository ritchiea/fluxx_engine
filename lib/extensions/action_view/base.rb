class ActionView::Base
  # Helper methods:
  helper_method :fluxx_paginate if respond_to?(:helper_method)
  
  require "will_paginate"
  def fluxx_paginate models
    # TODO ESH: there is a classloading issue around getting WillPaginate initialized.  Get an uninitialized constant WillPaginate::LinkRenderer if we try to put FluxxlinkRenderer in a class of its own
    unless Object.const_defined? 'FluxxLinkRenderer'
      klass = Object.const_set('FluxxLinkRenderer',Class.new(WillPaginate::ViewHelpers::LinkRenderer))
      
      klass.class_eval do
        include ActionView::Helpers::NumberHelper
      
        def to_html
          # previous/next buttons
          prev_button = previous_or_next_page(@collection.previous_page, @options[:previous_label] || 'previous', @options[:previous_label])
          next_button = previous_or_next_page(@collection.next_page, @options[:next_label] || 'next', @options[:next_label])
          
          info_message = %{%s - %s of %s} % [
            number_with_delimiter(@collection.offset + 1),
            number_with_delimiter(@collection.offset + @collection.length),
            number_with_delimiter(@collection.total_entries)
          ]
          
          
          html = "#{prev_button} #{info_message} #{next_button}"
          html_container(html)
          # result = @options[:container] ? @template.content_tag(:div, html, container_attributes) : html
          # @template.raw(result)
        end
      end
    end

    will_paginate models, :page_links => false, :renderer => FluxxLinkRenderer
  end
  
  def flash_info 
    if flash[:info] 
      msg = "<div class='fluxx-card-notice fluxx-card-info'><a class='fluxx-card-close-parent fluxx-card-auto-fade' href='#fluxx-card-notice'><img src='/fluxx_engine/theme/default/images/icons/cancel.png' /></a>#{flash[:info]}</div>"
      flash[:info] = nil
      raw msg
    end
  end

  def flash_error
    if flash[:error] 
      msg = "<div class='fluxx-card-notice fluxx-card-error'><a class='fluxx-card-close-parent' href='#fluxx-card-notice'><img src='/fluxx_engine/theme/default/images/icons/cancel.png' /></a>#{flash[:error]}</div>"
      flash[:error] = nil
      raw msg
    end
  end
  
  
end