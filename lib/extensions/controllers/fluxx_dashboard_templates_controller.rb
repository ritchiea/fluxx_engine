module FluxxDashboardTemplatesController
  extend FluxxModuleHelper

  ICON_STYLE = 'style-dashboard-templates'

  when_included do
    insta_index DashboardTemplate do |insta|
      insta.template = 'dashboard_template_list'
      insta.filter_title = "DashboardTemplates Filter"
      insta.filter_template = 'dashboard_templates/dashboard_template_filter'
      insta.order_clause = 'updated_at desc'
      insta.icon_style = ICON_STYLE
    end
    insta_show DashboardTemplate do |insta|
      insta.template = 'dashboard_template_show'
      insta.icon_style = ICON_STYLE
    end
    insta_new DashboardTemplate do |insta|
      insta.template = 'dashboard_template_form'
      insta.icon_style = ICON_STYLE

    end
    insta_edit DashboardTemplate do |insta|
      insta.template = 'dashboard_template_form'
      insta.icon_style = ICON_STYLE
    end
    insta_post DashboardTemplate do |insta|
      insta.template = 'dashboard_template_form'
      insta.icon_style = ICON_STYLE
    end
    insta_put DashboardTemplate do |insta|
      insta.template = 'dashboard_template_form'
      insta.icon_style = ICON_STYLE
    end
    insta_delete DashboardTemplate do |insta|
      insta.template = 'dashboard_template_form'
      insta.icon_style = ICON_STYLE
    end
    insta_related DashboardTemplate do |insta|
      insta.add_related do |related|
      end
    end
  end
end