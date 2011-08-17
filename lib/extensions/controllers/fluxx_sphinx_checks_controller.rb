module FluxxSphinxChecksController
  extend FluxxModuleHelper

  ICON_STYLE = 'style-sphinx-checks'

  when_included do
    insta_index SphinxCheck do |insta|
      insta.template = 'sphinx_check_list'
      insta.filter_title = "SphinxChecks Filter"
      insta.filter_template = 'sphinx_checks/sphinx_check_filter'
      insta.order_clause = 'updated_at desc'
      insta.icon_style = ICON_STYLE
    end
    insta_show SphinxCheck do |insta|
      insta.template = 'sphinx_check_show'
      insta.icon_style = ICON_STYLE
      insta.add_workflow
    end
    insta_new SphinxCheck do |insta|
      insta.template = 'sphinx_check_form'
      insta.icon_style = ICON_STYLE
    end
    insta_edit SphinxCheck do |insta|
      insta.template = 'sphinx_check_form'
      insta.icon_style = ICON_STYLE
    end
    insta_post SphinxCheck do |insta|
      insta.template = 'sphinx_check_form'
      insta.icon_style = ICON_STYLE
    end
    insta_put SphinxCheck do |insta|
      insta.template = 'sphinx_check_form'
      insta.icon_style = ICON_STYLE
      insta.add_workflow
    end
    insta_delete SphinxCheck do |insta|
      insta.template = 'sphinx_check_form'
      insta.icon_style = ICON_STYLE
    end
    insta_related SphinxCheck do |insta|
      insta.add_related do |related|
      end
    end
  end
end