module FluxxSphinxChecksController
  extend FluxxModuleHelper

  ICON_STYLE = 'style-sphinx-checks'

  when_included do
    insta_skip_require_user SphinxCheck
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
    end
    insta_put SphinxCheck do |insta|
      insta.template = 'sphinx_check_form'
      insta.icon_style = ICON_STYLE
    end
  end
end