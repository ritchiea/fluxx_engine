module ApplicationEngineHelper
  # Use GET
  def current_index_path options={}
    send "#{@controller.controller_path}_path", options
  end

  # Use POST
  def current_create_path options={}
    send "#{controller.controller_path}_path", options
  end
  
  # Use GET
  def current_new_path options={}
    send "new_#{controller.controller_path.singularize}_path", options
  end

  # Use GET
  def current_edit_path model_id, options={}
    send "edit_#{controller.controller_path.singularize}_path", options.merge({:id => model_id})
  end

  # Use GET
  def current_show_path model_id, options={}
    send "#{controller.controller_path.singularize}_path", options.merge({:id => model_id})
  end

  # Use PUT
  def current_put_path model_id, options={}
    send "#{controller.controller_path.singularize}_path", options.merge({:id => model_id})
  end

  # Use DELETE
  def current_delete_path model_id, options={}
    send "#{controller.controller_path.singularize}_path", options.merge({:id => model_id})
  end
  
  def as_currency(number)
    number_to_currency(number || 0, :precision => 2)
  end
  
  def flash_info
    if flash[:info] 
      msg = "<div class='notice'><a class='close-parent' href='#fluxx-card-notice'><img src='/images/fluxx_engine/theme/default/icons/cancel.png' /></a>#{flash[:info]}</div>"
      flash[:info] = nil
      raw msg
    end
  end

  def flash_error
    if flash[:error] 
      msg = "<div class='notice error'><a class='close-parent' href='#fluxx-card-notice'><img src='/images/fluxx_engine/theme/default/icons/cancel.png' /></a>#{flash[:error]}</div>"
      flash[:error] = nil
      raw msg
    end
  end

  def external_link link
    link = ((!link || link =~ /^http:/ || link.empty?) ? link : 'http://' + link)
    link_to link, link, :target => "blank" unless !link || link.empty?
  end

  def email_link email_address
    link_to(email_address, "mailto:#{email_address}") unless !email_address || email_address.empty?
  end

  def all_model_types
    # TODO ESH: this needs to be reconsidered
    allowed_models = ["Deal", "Request", "RequestReport", "User", "Organization", "ProjectList", "Project", "Program", "Loi", "FundingSourceAllocationAuthority"]
    Module.constants.select do |constant_name|
      constant = eval constant_name
      constant if not constant.nil? and constant.is_a? Class and constant.superclass == ActiveRecord::Base and allowed_models.include? constant_name
    end.sort
  end
  
end