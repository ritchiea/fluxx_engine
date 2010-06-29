class ActiveRecord::Base
  def self.insta_search
    local_search_object = @search_object = ActiveRecord::ModelDslSearch.new(self)
    yield @search_object if block_given?
    
    self.instance_eval do
      def model_search q_search, request_params, results_per_page=25, options={}, really_delete=false
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
  
  def self.admin_attributes
    @admin_attributes || (superclass.respond_to?(:admin_attributes) ? superclass.admin_attributes : nil)
  end
  

  def self.track_admin options
    @admin_attributes = {}
    @admin_attributes[:admin_attributes] = options[:admin_attributes] || []
  end
  
  
  
  # Truncate the hours/min/seconds and store UTC time.  Also retrieve UTC time bereft of hours/minutes/second
  def self.specify_utc_time_attributes time_attributes
    @class_time_attributes = time_attributes.clone
    time_attributes.each do |name|
      define_method name do
        value = read_attribute(name.to_sym)
        Time.utc(value.year,value.month,value.day,0,0,0) if value
      end
      
      define_method "#{name}=" do |date|
        begin
          date = Time.parse(date) if date.is_a?(String) && !(date.blank?)
          if date && (date.is_a?(Time) || date.is_a?(Date))
            write_attribute(name.to_sym, Time.utc(date.year,date.month,date.day,0,0,0))
          else
            write_attribute(name.to_sym, nil)
          end
        rescue ArgumentError => e
          # Errors need to be added at validation time; so we save them in an array for later use
          self.add_utc_time_validate_error name, I18n.t(:bad_date_format, :date_string => date)
        end
      end
    end
  end
  
  def self.utc_time_attrs
    @class_time_attributes 
  end
  
  def self.add_validate_utc_time
    self.validate :validate_utc_time
  end
  
  def add_utc_time_validate_error name, error
    @utc_time_validate_errors = [] unless @utc_time_validate_errors
    @utc_time_validate_errors << [name, error]
  end
  
  def validate_utc_time
    if @utc_time_validate_errors
      @utc_time_validate_errors.each do |error_array|
        name, error = error_array
        self.errors.add name, error
      end
    end
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
end