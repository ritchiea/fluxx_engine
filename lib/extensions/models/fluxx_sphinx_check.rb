module FluxxSphinxCheck
  extend FluxxModuleHelper

  SEARCH_ATTRIBUTES = [:created_at, :updated_at, :id, :check_ts]
  
  when_included do
    insta_search do |insta|
      insta.filter_fields = SEARCH_ATTRIBUTES
      insta.derived_filters = {}
    end

    add_sphinx if respond_to?(:sphinx_indexes) && !(connection.adapter_name =~ /SQLite/i)
  end
  

  class_methods do
    def add_sphinx
      define_index :sphinx_check_first do
        # fields
        indexes :check_ts

        # attributes
        has created_at, updated_at, check_ts
        set_property :delta => :delayed
      end
    end
  end
end