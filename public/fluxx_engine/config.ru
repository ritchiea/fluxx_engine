require 'json'

module Rack
  class FluxxBuilder
    def initialize app
      @app = app
    end
    def call env
      `rake build`
      @app.call env
    end
  end
  class FluxxRTUPolling
    def initialize app
      @app = app
      @last_id = 0
      @update_id = 0
    end
    def last_id_counter
      @last_id = @last_id + 1
    end
    def update_id_counter
      @update_id = @update_id + 1
    end
    def call env
      path = Utils.unescape(env["PATH_INFO"])
      if path.match(/rtu_polling$/)
        body = JSON.pretty_generate ({
          'last_id' => last_id_counter,
          'ts'      => Time.now.to_i,
          'deltas'  => [
            {
              'id' => update_id_counter,
              "delta_attributes" => {
                  "created_by_id" => 13357,
                  "sub_program_id" => 22,
                  "filter_state" => "funding_recommended",
                  "program_organization_id" => 2388,
                  "favorite_user_ids" => [],
                  "lead_user_ids" => 13404,
                  "last_note_id" => nil,
                  "org_owner_user_ids" => 4616,
                  "program_id" => 10,
                  "fiscal_organization_id" => nil,
                  "granted" => false,
                  "filter_type" => "GrantRequest"
              },
              'action' => 'create',
              'user_id' => 1,
              'model_id' => 1000,
              'type_name' => 'TheTypeName',
              'model_class' => 'TheModelClass',
            },
            {
              'id' => update_id_counter,
              "delta_attributes" => {
                  "created_by_id" => 13357,
                  "sub_program_id" => 22,
                  "filter_state" => "funding_recommended",
                  "program_organization_id" => 2388,
                  "favorite_user_ids" => [],
                  "lead_user_ids" => 13404,
                  "last_note_id" => nil,
                  "org_owner_user_ids" => 4616,
                  "program_id" => 10,
                  "fiscal_organization_id" => nil,
                  "granted" => false,
                  "filter_type" => "GrantRequest"
              },
              'action' => 'delete',
              'user_id' => 1,
              'model_id' => 1000,
              'type_name' => 'TheTypeName',
              'model_class' => 'TheModelClass',
            },
            {
              'id' => update_id_counter,
              "delta_attributes" => {
                  "created_by_id" => 13357,
                  "sub_program_id" => 22,
                  "filter_state" => "funding_recommended",
                  "program_organization_id" => 2388,
                  "favorite_user_ids" => [],
                  "lead_user_ids" => 13404,
                  "last_note_id" => nil,
                  "org_owner_user_ids" => 4616,
                  "program_id" => 10,
                  "fiscal_organization_id" => nil,
                  "granted" => false,
                  "filter_type" => "GrantRequest"
              },
              'action' => 'update',
              'user_id' => 1,
              'model_id' => 1000,
              'type_name' => 'TheTypeName',
              'model_class' => 'TheOtherModelClass',
            }
          ]
        })
        size = body.respond_to?(:bytesize) ? body.bytesize : body.size
        return [
          200,
          {'Content-type' => 'application/json', 'Content-Length' => size.to_s},
          body
        ]
      else
        return @app.call env
      end
    end
  end
end

use Rack::FluxxBuilder
use Rack::FluxxRTUPolling

root=Dir.pwd
puts ">>> Serving => #{root}"
run Rack::Directory.new("#{root}")
