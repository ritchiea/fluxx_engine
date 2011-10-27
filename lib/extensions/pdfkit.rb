class PDFKit
  class Middleware
    # Add an extra level of checking
    def render_as_pdf_with_override?
      request_path_is_pdf = render_as_pdf_without_override?
      result = if request_path_is_pdf && @conditions[:fluxx_except]
        request_uri = @request.env['REQUEST_URI']
        rules = [@conditions[:fluxx_except]].flatten
        rules.none? do |pattern|
          if pattern.is_a?(Regexp)
            request_uri =~ pattern
          else
            request_uri[0, pattern.length] == pattern
          end
        end
      else
        request_path_is_pdf
      end
    end
    
    alias_method_chain :render_as_pdf?, :override
    
  end
end
