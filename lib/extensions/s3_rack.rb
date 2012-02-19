# -*- coding: utf-8 -*-
module Rack
  
  class S3Rack
    def initialize app
      @app = app
      # Grab the S3 credentials from Paperclip - whoo hoo!!
      @s3_credentials = Paperclip::Attachment.new 'n/a', 'n/a', :storage => :s3, :s3_credentials => "#{Rails.root}/config/amazon_s3.yml"
    end
    def call env
      s3_response = if env["PATH_INFO"] =~ /^\/s3\/(\d*)\/(\d*)/
        # TODO ESH: consider using some kind of token rather than passing the actual client_id
        client_id = $1
        modeldoc_id = $2
        
        user_id = env["rack.session"]['user_credentials_id']
        raise Exception.new('Unauthenticated User') if user_id.blank? || User.where(:id => user_id).count == 0
        model_document = if defined? Client
          if client_id && (new_client = Client.where(:id => client_id).first)
            old_client = Client.current
            begin
              Client.use new_client
              ModelDocument.where(:id => modeldoc_id).first
            ensure
              Client.use old_client
            end
          end
        else
          ModelDocument.where(:id => modeldoc_id).first
        end
          
        error_flag = false
        response = unless model_document
          error_flag = true
        else
          bucket = @s3_credentials.s3_bucket.name
          s3 = @s3_credentials.s3_interface
          if model_document.document && model_document.document.url
            i = model_document.document.url.index bucket
            document_key = model_document.document.url[(i+bucket.length+1)..model_document.document.url.length]
            # strip off querystring parameters if any; everything after the question mark
            document_key = $1 if document_key =~ /(.*)\?.*/
            remote_file = s3.buckets[bucket].objects[CGI.unescape(document_key)]
            [200, {'Content-Type' => remote_file.content_type, 'Content-Disposition' => "attachment; filename=#{model_document.document_file_name}"}, RenderS3Response.new(remote_file)]
          end
        end
        
        if !error_flag && response.is_a?(Array)
          response
        else
          [ 404, {'Content-Type' => 'text/plain'}, 'file not found' ]
        end
      else
        response, headers, content = @app.call env
        [response, headers, content]
      end
    end
  end
end


class RenderS3Response
  CHUNK_SIZE = 1048576 # 1 megabyte
  def initialize file
    @s3_response = file
    @size = @s3_response.content_length if @s3_response.respond_to?(:content_length)
    @byte_offset = 0
  end
  
  def each &block
    # per https://forums.aws.amazon.com/thread.jspa?threadID=80938
    while @byte_offset < @size
      range = "bytes=#{@byte_offset}-#{@byte_offset + CHUNK_SIZE - 1}"
      block.call(@s3_response.read(:range => range))
      @byte_offset += CHUNK_SIZE
    end
  end
end
