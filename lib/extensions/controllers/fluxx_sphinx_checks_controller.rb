module FluxxSphinxChecksController
  extend FluxxModuleHelper

  ICON_STYLE = 'style-sphinx-checks'

  when_included do
    insta_skip_require_user SphinxCheck
    insta_show SphinxCheck do |insta|
      insta.template = 'sphinx_check_show'
      insta.icon_style = ICON_STYLE
      insta.format do |format|
        format.html do |triple|
          controller_dsl, outcome, default_block = triple
          if params[:check_models] == '1'
            check_results = SphinxCheck.check_all.map{|hash| k, v = hash.first if hash; v}.compact
            render :text => check_results.to_json
          end
        end
      end
      
    end
    insta_put SphinxCheck do |insta|
      insta.template = 'sphinx_check_form'
      insta.icon_style = ICON_STYLE
    end
  end
end