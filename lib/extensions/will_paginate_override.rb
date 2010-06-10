module WillPaginate
  class LinkRenderer
    protected
    def page_link(page, text, attributes = {})
      attributes[:class] = [attributes[:class], 'fluxx-card-link-to-self'].compact.join ' '
      @template.link_to text, url_for(page), attributes
    end
  end
end
