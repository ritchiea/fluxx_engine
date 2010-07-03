class ActiveRecord::Base
  def self.insta_search
    local_search_object = @search_object = ActiveRecord::ModelDslSearch.new(self)
    yield @search_object if block_given?
    
    self.instance_eval do
      def model_search q_search, request_params={}, results_per_page=25, options={}, really_delete=false
        @search_object.model_search q_search, request_params, results_per_page, options, really_delete
      end
      
      def safe_find model_id
        @search_object.safe_find model_id
      end
    end
    
    define_method :safe_delete do |fluxx_current_user|
      local_search_object.safe_delete self, fluxx_current_user
    end
  end

  def self.insta_export
    local_export_object = @export_object = ActiveRecord::ModelDslExport.new(self)
    yield @export_object if block_given?
    
    self.instance_eval do
      def csv_sql_query with_clause
        @export_object.csv_sql_query with_clause
      end
      def csv_headers with_clause
        @export_object.csv_headers with_clause
      end
      def csv_filename with_clause
        @export_object.csv_filename with_clause
      end
    end
  end

  def self.insta_realtime
    local_realtime_object = @realtime_object = ActiveRecord::ModelDslRealtime.new(self)
    yield @realtime_object if block_given?
    
    after_create {|model| local_realtime_object.realtime_create_callback model }
    after_update {|model| local_realtime_object.realtime_update_callback model }
    after_destroy {|model| local_realtime_object.realtime_destroy_callback model }
    
    self.instance_eval do
      def without_realtime(&block)
        realtime_was_disabled = @realtime_object.realtime_disabled
        @realtime_object.realtime_disabled = true
        returning(block.call) { @realtime_object.realtime_disabled = false unless realtime_was_disabled }
      end
    end
  end
  
  def self.insta_lock
    local_lock_object = @lock_object = ActiveRecord::ModelDslLock.new(self)
    yield @lock_object if block_given?
    
    define_method 'editable?'.to_sym do |fluxx_current_user|
      local_lock_object.editable? self, fluxx_current_user
    end
    
    define_method :add_lock do |fluxx_current_user|
      local_lock_object.add_lock self, fluxx_current_user
    end

    define_method :remove_lock do |fluxx_current_user|
      local_lock_object.remove_lock self, fluxx_current_user
    end
    
    define_method :extend_lock do |fluxx_current_user, extend_interval|
      local_lock_object.extend_lock self, fluxx_current_user, extend_interval
    end
    
  end
  
  def self.insta_multi
    @multi_element_object = ActiveRecord::ModelDslMultiElement.new(self)
    @multi_element_object.add_multi_elements
    
    self.instance_eval do
      def multi_element_names
        @multi_element_object.multi_element_attributes || (superclass.respond_to?(:multi_element_names) ? superclass.multi_element_names : nil)
      end

      def single_multi_element_names
        @multi_element_object.single_element_attributes || (superclass.respond_to?(:single_multi_element_names) ? superclass.single_multi_element_names : nil)
      end
    end
    
  end
  
  def self.insta_utc
    @utc_object = ActiveRecord::ModelDslUtc.new(self)
    yield @utc_object if block_given?
    
    @utc_object.add_utc_time_attributes
  end
  
  ############ Utility Helper Methods ###############################

  def filter_amount amount
    if amount.is_a? String
      amount.gsub("\$", "").gsub(",","")
    else
      amount
    end
  end

  # Take a paginated collection of IDs and load up the related full objects, maintaining the pagination constants
  def self.page_by_ids model_ids
    unpaged_models = self.find model_ids
    model_map = unpaged_models.inject({}) {|acc, model| acc[model.id] = model; acc}
    ordered_list = model_ids.map {|model_id| model_map[model_id]}
    WillPaginate::Collection.create model_ids.current_page, model_ids.per_page, model_ids.total_entries do |pager|
      pager.replace ordered_list
    end
  end

  # Make it so that we do not emit a realtime update or thinking sphinx delta change record based on this update
  def update_attribute_without_log key, value
    if self.class.respond_to?(:sphinx_indexes) && self.class.sphinx_indexes
      self.class.suspended_delta(false) do
        if self.class.respond_to? :without_realtime
          self.class.without_realtime do
            self.update_attribute key, value
          end
        else
          self.update_attribute key, value
        end
      end
    else
      if self.class.respond_to? :without_realtime
        self.class.without_realtime do
          self.update_attribute key, value
        end
      else
        self.update_attribute key, value
      end
    end
  end
  
  # Make it so that we do not emit a realtime update or thinking sphinx delta change record based on this update
  def update_attributes_without_log attr_map
    if self.class.respond_to?(:sphinx_indexes) && self.class.sphinx_indexes
      self.class.suspended_delta(false) do
        if self.class.respond_to? :without_realtime
          self.class.without_realtime do
            self.update_attributes attr_map
          end
        else
          self.update_attributes attr_map
        end
      end
    else
      if self.class.respond_to? :without_realtime
        self.class.without_realtime do
          self.update_attributes attr_map
        end
      else
        self.update_attributes attr_map
      end
    end
  end
end