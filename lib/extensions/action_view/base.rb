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
          prev_button = page_link_or_span(@collection.previous_page, 'disabled prev_page', @options[:previous_label])
          next_button = page_link_or_span(@collection.next_page,     'disabled next_page', @options[:next_label])
          
          info_message = %{%s - %s of %s} % [
            number_with_delimiter(@collection.offset + 1),
            number_with_delimiter(@collection.offset + @collection.length),
            number_with_delimiter(@collection.total_entries)
          ]
          
          
          html = "#{prev_button} #{info_message} #{next_button}"
          @options[:container] ? @template.content_tag(:div, html, html_attributes) : html
        end
      end
    end

    will_paginate models, :page_links => false, :renderer => FluxxLinkRenderer
  end
  def link_to_delete label, model, options = {}, use_onclick=true
    options[:method] = :delete
    link_class = options.delete(:link_class)
    refresh_function = (options[:refresh] == :partial ? 'onCompleteRefreshPartial' : 'onCompleteRefresh')
    append_to = (options[:refresh] == :partial ? 'fluxxCardPartial' : 'fluxxCardArea')

    form = render_to_string(:inline => "<% form_for(model, :html => options) do |form| %><% end %>", :locals => {:model => model, :options => options})
    form.gsub!('\n',' ');
    form = "$('#{form}').submit(#{refresh_function}).appendTo($(this).#{append_to}()).submit();return false;"

    raw link_to(label, model, :onclick => (
        use_onclick ? "if(confirm('This record will be deleted. Are you sure?')) {#{form}}; return false;" : "#{form}"), :class => link_class)
  end
  
  def link_to_update label, model, options = {}
    options[:method] = :put
    link_class = options.delete(:link_class)
    raw link_to(label, model, :onclick => "$(this).next().submit();return false;", :class => link_class)
    form_for model, :html => options do |form| 
      yield form
    end
  end

  def link_to_post label, model, url, options = {}
    options[:method] = :post
    options[:style] = 'display: none'
    link_class = options.delete(:link_class)
    raw link_to(label, url, :onclick => "$(this).next().submit();return false;", :class => link_class)
    form_for model, :url => url, :html => options do |form| 
      yield form
    end
  end

  def link_to_create label, model, options = {}
    options[:method] = :post
    options[:style] = 'display: none'
    link_class = options.delete(:link_class)
    raw link_to(label, model, :onclick => "$(this).next().submit();return false;", :class => link_class)
    form_for model, :html => options do |form| 
      yield form
    end
  end
  
  def flash_info 
    if flash[:info] 
      msg = "<div class='fluxx-card-notice fluxx-card-info'><a class='fluxx-card-close-parent fluxx-card-auto-fade' href='#fluxx-card-notice'><img src='/images/icons/cancel.png' /></a>#{flash[:info]}</div>"
      flash[:info] = nil
      raw msg
    end
  end

  def flash_error
    if flash[:error] 
      msg = "<div class='fluxx-card-notice fluxx-card-error'><a class='fluxx-card-close-parent' href='#fluxx-card-notice'><img src='/images/icons/cancel.png' /></a>#{flash[:error]}</div>"
      flash[:error] = nil
      raw msg
    end
  end
  
  
end