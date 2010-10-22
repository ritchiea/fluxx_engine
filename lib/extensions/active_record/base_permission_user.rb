# stub class for the has_* methods
module BasePermissionUser
  def self.included(base)

    base.extend(ModelClassMethods)
    base.class_eval do
      include ModelInstanceMethods
    end
  end

  module ModelClassMethods
  end

  module ModelInstanceMethods
    def class_perm_name model_class
      if model_class.is_a? Class
        model_class.name.tableize.singularize.downcase
      elsif model_class.is_a? String
        model_class
      else
        model_class.class.name.tableize.singularize.downcase
      end
    end
    
    def has_role! role, model_class
      # p "ESH: setting @#{role}_#{class_perm_name(model_class)} true"
      instance_variable_set "@#{role}_#{class_perm_name(model_class)}", true
    end
    
    def clear_role role, model_class
      instance_variable_set "@#{role}_#{class_perm_name(model_class)}", false
    end
    
    def has_role? role, model_class
      # p "ESH: checking @#{role}_#{class_perm_name(model_class)} #{instance_variable_get("@#{role}_#{class_perm_name(model_class)}")}"
      instance_variable_get "@#{role}_#{class_perm_name(model_class)}"
    end
    
    def has_create_for_own_model? model_class
      has_role? 'create_own', model_class
    end
    
    def has_create_for_model? model_class
      has_role? 'create', model_class
    end
    
    def has_update_for_own_model? model
      has_role? 'update_own', model_class
    end

    def has_update_for_model? model_class
      has_role? 'update', model_class
    end
    
    def has_delete_for_own_model? model
      has_role? 'delete_own', model_class
    end

    def has_delete_for_model? model_class
      has_role? 'delete', model_class
    end
    
    def has_listview_for_model? model_class
      has_role? 'listview', model_class
    end
    
    def has_view_for_own_model? model
      has_role? 'view_own', model_class
    end

    def has_view_for_model? model_class
      has_role? 'view', model_class
    end
  end
end