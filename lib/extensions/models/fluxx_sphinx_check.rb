module FluxxSphinxCheck
  extend FluxxModuleHelper

  SEARCH_ATTRIBUTES = [:created_at, :updated_at, :id, :check_ts]
  
  MODEL_CHECKS = []
  
  def self.add_check model_klass, min_threshold, num_reps=2
    MODEL_CHECKS << {:klass => model_klass, :threshold => min_threshold, :reps => num_reps}
  end
  
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
        indexes "cast(check_ts as char(255))", :as => :name, :sortable => true

        # attributes
        has created_at, updated_at, check_ts
        set_property :delta => :delayed
      end
    end

    # For each model class registered, make a call to sphinx to see if we can get 1 result back, and check that the total entries is greater than a particular threshold
    # Run it multiple times specified by reps.
    # This is to identify the zero entries bugs
    def check_all
      MODEL_CHECKS.map do |check_hash|
        klass = check_hash[:klass]
        threshold = check_hash[:threshold]
        reps = check_hash[:reps]
        reps.to_i.times.map {results = klass.model_search('', {}, 1); {klass => (results.total_entries > threshold ? nil : "#{klass.name} had #{results.total_entries} total_entries, which is less than the expected threshold of #{threshold}")}}
      end.compact.flatten
    end
  end
end