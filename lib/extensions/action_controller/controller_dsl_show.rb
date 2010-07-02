class ActionController::ControllerDslShow < ActionController::ControllerDsl
  attr_accessor :audit_template
  attr_accessor :footer_template
  attr_accessor :audit_footer_template
  attr_accessor :mode_template
  attr_accessor :footer_template
  attr_accessor :exclude_related_data
  
  def perform_show params
    if params[:audit_id]
      new_model = model_class.new
      audit = Audit.find params[:audit_id] rescue nil
      if audit
        m2 = YAML::load audit.full_model if audit.full_model
        if m2
          m2.keys.each do |k|
            k2 = "#{k.to_s}="
            new_model.send k2.to_sym, m2[k] rescue nil
          end
          new_model.id = audit.auditable_id
          new_model
        end
      end
    else
      load_existing_model params
    end
  end
  
  def calculate_show_options model, params
    options = {}
    options[:template] = template
    options[:footer_template] = footer_template
    if params[:audit_id]
      # Allows the user to load up a history record
      options[:template] = audit_template if audit_template
      options[:footer_template] = audit_footer_template if audit_footer_template
      options[:full_model] = load_existing_model model.id
    elsif params[:mode]
      # Allows the user to load up an alternate view (mode) based on a hash
      options[:template] = mode_template[params[:mode].to_s] unless mode_template.blank? || mode_template[params[:mode].to_s].blank?
    end
    options
  end
  
  def calculate_error_options params
    if params[:audit_id]
      I18n.t(:insta_no_audit_record_found, :model_id => params[:id])
    else
      I18n.t(:insta_no_record_found, :model_id => params[:id])
    end
  end
end