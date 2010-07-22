# Formtastic::SemanticFormBuilder.fieldset_legend_as = :h2

module Formtastic #:nodoc:

  class SemanticFormBuilder < ActionView::Helpers::FormBuilder

    @@inline_order = [ :input, :aft, :hints, :errors ]    
    
    include ActionView::Helpers::JavaScriptHelper
    include ActionView::Helpers::TagHelper
    include ActionView::Helpers::FormTagHelper
    include ActionView::Helpers::AssetTagHelper    
    
    # Generates HTML content after for the given method using the HTML supplied in :aft
    #
    def inline_aft_for(method, options) #:nodoc:
      options[:aft]
    end

    def find_collection_for_column_with_multi(column, options)
      if (@object.class.respond_to?(:multi_element_names) && @object.class.multi_element_names && @object.class.multi_element_names.include?(column.to_s))
        unless options[:collection]
          group = MultiElementGroup.find :first, :conditions => {:name => column.to_s}
          if group
            options[:collection] = MultiElementValue.find(:all, :conditions => ['multi_element_group_id = ?', group.id]).collect {|p| [ (p.description || p.value), p.id ] }
          end
        end
      elsif   (@object.class.respond_to?(:single_multi_element_names) && @object.class.single_multi_element_names && @object.class.single_multi_element_names.include?(column.to_s))
        unless options[:collection]
          group = MultiElementGroup.find :first, :conditions => {:name => column.to_s.pluralize}
          if group
            options[:collection] = MultiElementValue.find(:all, :conditions => ['multi_element_group_id = ?', group.id]).collect {|p| [ (p.description || p.value), p.id ] }
          end
        end
      end
      find_collection_for_column_without_multi column, options
    end
    alias_method_chain :find_collection_for_column, :multi
    
    def date_or_datetime_input(method, options)
      date_time = @object ? @object.send(method) : nil
      formatted_date_time = if date_time
        date_time.to_s(:mdy)
      else
        nil
      end
      options = options.reverse_merge(:size => 12)
      if options[:class].blank?
        options[:class] = 'date_field'
      else
        options[:class] += ' date_field'
      end
      options[:value] = formatted_date_time if formatted_date_time
      label("#{method}:", :label => options[:label]) + text_field(method, options)
    end
    
    # derived from the formtastic::select_input method
    # This will use the http://mypaaji.com/index.php/2009/06/29/jquery-plugin-multiple-select-transfer/ plugin to use two selectboxes
    def select_transfer_input(method, options)
      collection = find_collection_for_column(method, options)
      html_options = options.delete(:input_html) || {}

      unless options.key?(:include_blank) || options.key?(:prompt)
        options[:include_blank] = true
      end

      reflection = self.reflection_for(method)
      
      if reflection && [ :has_many, :has_and_belongs_to_many ].include?(reflection.macro)
        options[:include_blank]   = false
        html_options[:multiple] = true if html_options[:multiple].nil?
        html_options[:size]     ||= 5
      end

      class_added_selector = html_options[:class_added_selector] || 'fluxx_select_transfer_added'
      class_right_selector = html_options[:class_right_selector] || 'fluxx-card-form-transfer-select-right-side'
      class_left_selector = html_options[:class_left_selector] || 'fluxx-card-form-transfer-select-left-side'
      class_add_button = html_options[:class_left_selector] || 'fluxx-card-form-transfer-add-button'
      class_remove_button = html_options[:class_left_selector] || 'fluxx-card-form-transfer-remove-button'
      
      extra_class = html_options[:class]
      extra_class_left_selector = extra_class ? "#{extra_class}-left" : ''
      extra_class_right_selector = extra_class ? "#{extra_class}-right" : ''
      extra_class_add_button = extra_class ? "#{extra_class}-add" : ''
      extra_class_remove_button = extra_class ? "#{extra_class}-remove" : ''
      label_class = html_options[:label_class]

      input_name = generate_association_input_name(method)
      rand_id = generate_random_id
      not_used_selectbox_id = "not_used_select_#{rand_id}"
      used_selectbox_id = "used_select_#{rand_id}"
      add_button_id = "add_button_#{rand_id}"
      remove_button_id = "remove_button_#{rand_id}"
      html_options[:id] = used_selectbox_id
      selected_elements = (@object.send(method) || []).map {|p| [ ((p.respond_to?(:description) && p.description) || (p.respond_to?(:value) && p.value)) || p.to_s, p.id  ] }
      not_selected_elements = collection - selected_elements
      not_select_options = self.options_for_select not_selected_elements, selected_elements, class_added_selector
      selected_options = self.options_for_select(selected_elements, selected_elements, class_added_selector)
      select_transfer_function =  "$('body').one('fluxxCardLoadContent',function(e, $area){$('##{not_used_selectbox_id}').transfer({
      	to:'##{used_selectbox_id}',//selector of second multiple select box
      	addId:'##{add_button_id}',//add buttong id
      	removeId:'##{remove_button_id}' // remove button id
      	});
      })"
      form_name = @object.class.name.tableize.singularize.downcase
      
      select_input_name = "#{form_name}[#{input_name}]"
      # TODO ESH: refactor this to put more of it on the client side.  Had to hard-code the image path which could pose issues for asset servers
      label(method, options_for_label(options).merge(:input_name => input_name, :class => label_class)) + "<li class='select-left'>" +
        select_tag("ignored", not_select_options, html_options.merge(:id => not_used_selectbox_id, :class => "#{class_left_selector}  #{extra_class_left_selector}")) + 
        "</li><li class='#{class_add_button} #{extra_class_add_button}' id='#{add_button_id}'>" + 
        "<image src='/images/icon_select_add.png' width='35' height='26', alt='Add'>" + #image_tag('/images/icon_select_add.png', :width=>'35', :height=>'26', :alt=>'Add') + 
        "<ol>" +
        "<li class='#{class_remove_button} #{extra_class_remove_button}' id='#{remove_button_id}'>" + 
        "<image src='/images/icon_select_remove.png' width='35' height='26', alt='Remove'>" #image_tag('/images/icon_select_remove.png', :width=>'35', :height=>'26', :alt=>'Remove') + 
        "</li></ol></li>" +
        "<li class='select-right'>" + select_tag(select_input_name, selected_options, html_options.merge(:id => used_selectbox_id, :class => "#{class_right_selector} #{extra_class_right_selector}")) + "</li>" +
        javascript_tag(select_transfer_function)
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
        text_field_tag(method, nil, {"data-sibling".to_sym => sibling_id.to_s, "data-autocomplete".to_sym => options[:autocomplete_url], :value => value_name}) + 
        hidden_field(input_name, {"data-sibling".to_sym => sibling_id.to_s})
    end
    
    def generate_random_id
      (rand * 999999999).to_i
    end
    
    def options_for_select container, selected_list, class_name
      class_decorator = if class_name
        "class='#{class_name}'" 
      end
      options_for_select = container.inject([]) do |options, text_value|
        text, value = text_value
        options << %(<option value="#{html_escape(value.to_s)}" "#{class_decorator if class_decorator && selected_list.include?(text_value)}">#{html_escape(text.to_s)}</option>)
      end
      
      options_for_select.join("\n")
    end
  end
end
