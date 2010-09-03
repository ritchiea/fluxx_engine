class ClientStoresController < ApplicationController
  insta_index ClientStore do |insta|
    insta_index ClientStore do |insta|
      insta.pre do |controller_dsl, controller|
        controller.pre_models = if controller.fluxx_current_user
          search = ClientStore.where(:user_id => controller.fluxx_current_user.id).where(:deleted_at => nil)
          if controller.params[:name]
            search = search.where(:name => controller.params[:name]) 
          end
          results = search.all
        else
          []
        end
      end
    end
    
    insta.format do |format|
      format.json do |controller_dsl, controller, outcome|
        controller.render :inline => controller.instance_variable_get("@models").map {|model| {:client_store => (model.attributes), :url => controller.url_for(model)}}.to_json
      end
    end
  end
  insta_post ClientStore do |insta|
    insta.pre do |conf, controller|
      controller.pre_model = ClientStore.new controller.params[:client_store]
      controller.pre_model.user_id = controller.fluxx_current_user.id if controller.fluxx_current_user
    end
  end
  insta_put ClientStore
  insta_delete ClientStore
  insta_show ClientStore do |insta|
    insta.template = 'client_store_show'
  end
end