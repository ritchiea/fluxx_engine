class ActionView::Base
  # Helper methods:
  helper_method :fluxx_paginate if respond_to?(:helper_method)
  
  require "will_paginate"
  def fluxx_paginate models
    # TODO ESH: there is a classloading issue around getting WillPaginate initialized.  Get an uninitialized constant WillPaginate::LinkRenderer if we try to put FluxxlinkRenderer in a class of its own
    unless Object.const_defined? 'FluxxLinkRenderer'
      klass = Object.const_set('FluxxLinkRenderer',Class.new(WillPaginate::ActionView::LinkRenderer))
      
      klass.class_eval do
        include ActionView::Helpers::NumberHelper
      
        def to_html
          # previous/next buttons
          prev_button = previous_or_next_page(@collection.previous_page, @options[:previous_label] || 'previous', 'previous to-self')
          next_button = previous_or_next_page(@collection.next_page, @options[:next_label] || 'next', 'next to-self')
          
          info_message = %{%s - %s of %s} % [
            number_with_delimiter(@collection.offset + 1),
            number_with_delimiter(@collection.offset + @collection.length),
            number_with_delimiter(@collection.total_entries)
          ]
          
          
          html = "<ul class='paginate'><li class='prev'>#{prev_button}</li><li class='paginate-info'><span class='disabled'>#{info_message}</span></li><li class='next'>#{next_button}</li></ul>"
          html_container(html)
          # result = @options[:container] ? @markup.content_tag(:div, html, container_attributes) : html
          # @markup.raw(result)
        end
      end
    end
    
    unless models.empty? || !models.respond_to?(:total_pages)
      will_paginate models, :page_links => false, :renderer => FluxxLinkRenderer, :previous_label => '&laquo; Prev', :next_label => "Next &raquo;"
    end
  end
  

end