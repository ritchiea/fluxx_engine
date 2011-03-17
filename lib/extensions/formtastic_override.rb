# Formtastic::SemanticFormBuilder.fieldset_legend_as = :h2

module Formtastic #:nodoc:

  class SemanticFormBuilder < ActionView::Helpers::FormBuilder

    self.inline_order = [ :input, :aft, :hints, :errors ]    
    
    include ActionView::Helpers::JavaScriptHelper
    include ActionView::Helpers::TagHelper
    include ActionView::Helpers::FormTagHelper
    include ActionView::Helpers::AssetTagHelper    
    
    # Generates HTML content after for the given method using the HTML supplied in :aft
    #
    def inline_aft_for(method, options) #:nodoc:
      template.content_tag(:div, Formtastic::Util.html_safe(options[:aft]), :class => 'inline-aft')
    end

    def find_collection_for_column_with_multi(column, options)
      if (@object.class.respond_to?(:multi_element_names) && @object.class.multi_element_names && @object.class.multi_element_names.include?(column.to_s))
        unless options[:collection]
          group = MultiElementGroup.find_for_model_or_super @object, column.to_s
          if group
            options[:collection] = MultiElementValue.find(:all, :conditions => ['multi_element_group_id = ?', group.id], :order => 'description asc, value asc').collect {|p| [ (p.description || p.value), p.id ] }
          end
        end
      elsif   (@object.class.respond_to?(:single_multi_element_names) && @object.class.single_multi_element_names && @object.class.single_multi_element_names.include?(column.to_s))
        unless options[:collection]
          group = MultiElementGroup.find_for_model_or_super @object, column.to_s
          if group
            options[:collection] = MultiElementValue.find(:all, :conditions => ['multi_element_group_id = ?', group.id], :order => 'description asc, value asc').collect {|p| [ (p.description || p.value), p.id ] }
          end
        end
      end
      find_collection_for_column_without_multi column, options
    end
    alias_method_chain :find_collection_for_column, :multi
    
    def date_or_datetime_input(method, options)
      date_time = @object ? @object.send(method) : nil
      formatted_date_time = if date_time
        date_time.mdy
      else
        nil
      end
      options[:value] = formatted_date_time if formatted_date_time
      label("#{method}:", :label => options[:label]) + text_field(method, options)
    end
    
    # Pass in autocomplete_url as the URL that should be invoked to load the results
    # Pass in :related_attribute_name in the options for the form.input to specify the attribute on the related object that should be called
    # So if a user_organization has an attribute organization that should be autocompleted, you want to display the organization's name.  
    # So the syntax would be:
    # = form.input :organization, :label => "Organization", :as => :autocomplete, :autocomplete_url => organizations_path(:format => :json), :related_attribute_name => :name
    def autocomplete_input(method, options)
      related_attribute_name = options[:related_attribute_name] || 'name'
      related_object = @object.send method.to_sym
      value_name = if related_object && related_object.respond_to?(related_attribute_name.to_sym)
        related_object.send related_attribute_name.to_sym 
      end || related_object
      
      input_name = generate_association_input_name(method)
      sibling_id = generate_random_id
      label("#{method}:", :label => options[:label]) + 
        text_field_tag(method, nil, (options[:input_html] || {}).merge({"data-sibling".to_sym => sibling_id.to_s, "data-autocomplete".to_sym => options[:autocomplete_url], :value => value_name})) + 
        hidden_field(input_name, {"data-sibling".to_sym => sibling_id.to_s, :class => options[:hidden_attribute_class]})
    end
    
    def generate_random_id
      (rand * 999999999).to_i
    end
    
  end
end
