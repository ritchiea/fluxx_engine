module Fluxx<%= controller_class_plural_table_name %>Controller
  ICON_STYLE = 'style-<%= controller_class_plural_table_name.gsub('_', '-') %>'
  def self.included(base)
    base.insta_index <%= controller_class_singular_name %> do |insta|
      insta.template = '<%= controller_class_singular_table_name %>_list'
      insta.filter_title = "<%= controller_class_name.pluralize %> Filter"
      insta.filter_template = '<%= controller_class_plural_table_name %>/<%= controller_class_singular_table_name %>_filter'
      insta.order_clause = 'updated_at desc'
      insta.icon_style = ICON_STYLE
    end
    base.insta_show <%= controller_class_singular_name %> do |insta|
      insta.template = '<%= controller_class_singular_table_name %>_show'
      insta.icon_style = ICON_STYLE
      insta.add_workflow
    end
    base.insta_new <%= controller_class_singular_name %> do |insta|
      insta.template = '<%= controller_class_singular_table_name %>_form'
      insta.icon_style = ICON_STYLE
    end
    base.insta_edit <%= controller_class_singular_name %> do |insta|
      insta.template = '<%= controller_class_singular_table_name %>_form'
      insta.icon_style = ICON_STYLE
    end
    base.insta_post <%= controller_class_singular_name %> do |insta|
      insta.template = '<%= controller_class_singular_table_name %>_form'
      insta.icon_style = ICON_STYLE
    end
    base.insta_put <%= controller_class_singular_name %> do |insta|
      insta.template = '<%= controller_class_singular_table_name %>_form'
      insta.icon_style = ICON_STYLE
      insta.add_workflow
    end
    base.insta_delete <%= controller_class_singular_name %> do |insta|
      insta.template = '<%= controller_class_singular_table_name %>_form'
      insta.icon_style = ICON_STYLE
    end
    base.insta_related <%= controller_class_singular_name %> do |insta|
      insta.add_related do |related|
      end
    end
    
    base.extend(ModelClassMethods)
    base.class_eval do
      include ModelInstanceMethods
    end
  end

  module ModelClassMethods
  end

  module ModelInstanceMethods
  end
end