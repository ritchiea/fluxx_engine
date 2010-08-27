class ClientStoresController < ApplicationController
  insta_index ClientStore do |insta|
    insta.pre do |controller_dsl, controller|
      controller.pre_models = if controller.fluxx_current_user
        search = ClientStore.where(:user_id => controller.fluxx_current_user.id)
        p "ESH: in pre_models client stores controller"
        if controller.params[:name]
          p "ESH: in client stores controller have #{controller.params[:name]}"
          search = search.where(:name => controller.params[:name]) 
        end
        results = search.all
      else
        []
      end
    end
    
    insta.format do |format|
      format.json do |controller_dsl, controller, outcome|
        controller.render :inline => @models.to_json
      end
    end
  end
  insta_post ClientStore do |insta|
    insta.format do |format|
      format.json do |controller_dsl, controller, outcome|
        controller.render :inline => outcome.to_s
      end
    end
  end
  insta_put ClientStore do |insta|
    insta.format do |format|
      format.json do |controller_dsl, controller, outcome|
        controller.render :inline => outcome.to_s
      end
    end
  end
  insta_delete ClientStore do |insta|
    insta.format do |format|
      format.json do |controller_dsl, controller, outcome|
        controller.render :inline => outcome.to_s
      end
    end
  end
end