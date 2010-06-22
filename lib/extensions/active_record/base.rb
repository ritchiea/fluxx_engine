class ActiveRecord::Base
  
  # Note that this may be overridden on a per model class basis or on an app-wide basis to allow for different search backends
  # q_search is the query the user entered to search for
  # request_params 
  # The following options are allowed:
  #   search_conditions: any conditions that should be applied to restrict the search
  #   order_clause: sort conditions
  #   include_relation: any extra relations that should be included
  def self.model_search q_search, request_params, results_per_page=25, options={}, really_delete=false
    if self.respond_to? :sphinx_indexes
      sphinx_model_search q_search, request_params, results_per_page=25, options, really_delete=false
    else
      sql_model_search q_search, request_params, results_per_page=25, options, really_delete=false
    end
  end
  
  def self.sql_model_search q_search, request_params, results_per_page=25, options={}, really_delete=false
    string_fields = self.columns.select {|col| col.type == :string}.map &:name
    queries = q_search.split ' '
    queries = queries.reject {|q| q.blank?}
    sql_conditions = string_fields.map {|field| queries.map {|q| self.send :sanitize_sql, ["#{field} like ?", "%#{q}%"]} }.flatten.compact.join ' OR '

    # Grab a list of models with just the ID, then swap out the list of models with a list of the IDs
    models = self.paginate :select => :id, :conditions => sql_conditions, :page => request_params[:page], :per_page => results_per_page, 
      :order => options[:order_clause], :include => options[:include_relation]
    models.replace models.map(&:id)
    models
  end

  def self.sphinx_model_search request_params, results_per_page=25, options={}, really_delete=false
    search_with_attributes = if options[:search_conditions]
      options[:search_conditions].clone 
    end || {}
    
    search_with_attributes.keys.each do |k|
      search_with_attributes[k] = search_with_attributes[k].to_crc32 unless search_with_attributes[k].to_s.is_numeric?
    end

    search_with_attributes[:deleted_at] = 0 unless really_delete

    if self.respond_to? :search_fields
      self.search_fields.each do |attr|
        unless request_params[attr].blank?
          split_params = request_params[attr].split(',')
          if self.respond_to?(:derived_filters) && self.derived_filters && self.derived_filters[attr] # some attributes have filtering methods; if so call it
            self.derived_filters[attr].call(search_with_attributes, request_params[attr]) # Send the raw un-split value
          elsif split_params.select{|split_param| !split_param.is_numeric?}.size > 0 # Check to see if any params are NOT numeric
            # Sphinx doesn't allow string attributes, so if we get a non-numeric value, search for the crc32 hash of it
            values = split_params.map{|val|val.to_crc32}
            search_with_attributes[attr] = values
          else
            search_with_attributes[attr] = split_params.map{|val| val.to_i}
          end
        end
      end
    end
    
    with_clause = (search_with_attributes || {})
    order_clause = if request_params[:sort_attribute] && request_params[:sort_order]
      "#{request_params[:sort_attribute]} #{request_params[:sort_order]}"
    else
      options[:order_clause]
    end

    p "searching for #{q_search}, with_clause = #{with_clause.inspect}, order_clause=#{order_clause.inspect}"
    model_ids = self.search_for_ids(
      q_search, :with => with_clause,
      :order => order_clause, :page => request_params[:page], 
      :per_page => results_per_page, :include => options[:include_relation])
    if model_ids.empty? && request_params[:page]
      # Could be we are loading a card listing with pagination that used to work, but now has fewer elements in it, so we should fall back to display the first page
      model_ids = self.search_for_ids(
        q_search, :with => with_clause,
        :order => order_clause,
        :per_page => results_per_page, :include => options[:include_relation])
    end
    model_ids
  end
  
  
  def self.search_attributes
    @search_attributes || (superclass.respond_to?(:search_attributes) ? superclass.search_attributes : nil)
  end
  
  def self.csv_attributes
    @csv_attributes || (superclass.respond_to?(:csv_attributes) ? superclass.csv_attributes : nil)
  end
  
  def self.admin_attributes
    @admin_attributes || (superclass.respond_to?(:admin_attributes) ? superclass.admin_attributes : nil)
  end
  
  def self.insta_associate
    has_many :notes, :as => :notable, :conditions => {:deleted_at => nil}
    has_many :group_members, :as => :groupable
    has_many :groups, :through => :group_members
    has_many :favorites, :as => :favorable
    belongs_to :locked_by, :class_name => 'User', :foreign_key => 'locked_by_id'
    add_validate_utc_time
  end

  def self.track_search options
    @search_attributes = {}
    @search_attributes[:attributes] = options[:attributes]
    @search_attributes[:derived_filters] = options[:derived_filters]
  end
  
  def self.track_csv options
    @csv_attributes = {}
    @csv_attributes[:sql_query] = options[:sql_query] || []
    @csv_attributes[:attributes] = options[:attributes] || []
    @csv_attributes[:headers] = options[:headers] || []
    @csv_attributes[:base_filename] = options[:base_filename] || []
  end
  
  def self.track_admin options
    @admin_attributes = {}
    @admin_attributes[:admin_attributes] = options[:admin_attributes] || []
  end
  
  def self.search_fields
    search_attributes ? search_attributes[:attributes] : []
  end
  
  def self.csv_sql_query with_clause
    sql_query = csv_attributes ? csv_attributes[:sql_query] : []
    sql_query.is_a?(Proc) ? (sql_query.call with_clause) : sql_query
  end

  def self.csv_fields with_clause
    attributes = csv_attributes ? csv_attributes[:attributes] : []
    attributes.is_a?(Proc) ? (attributes.call with_clause) : attributes
  end

  def self.csv_headers with_clause
    headers = csv_attributes ? csv_attributes[:headers] : []
    if headers.is_a?(Proc)
      (headers.call with_clause)
    else
      headers
    end
  end
  
  def self.csv_filename with_clause
    base_filename = csv_attributes ? csv_attributes[:base_filename] : []
    base_filename.is_a?(Proc) ? (base_filename.call with_clause) : base_filename
  end
  
  def self.derived_filters
    search_attributes ? search_attributes[:derived_filters] : {}
  end
  
  def self.aasm_state_extend name, options={}
    states = AASM::StateMachine[self].states
    offset = states.index name
    if offset && offset > -1 
      states.delete_at offset
    end
    aasm_state name, options
  end

  def self.aasm_event_extend name, options = {}, &block
    events = AASM::StateMachine[self].events
    events.delete name if events[name]
    aasm_event name, options, &block
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
  
  # I think we don't need this anymore...
  def self.audit_has_many_attribute attr_name
    # Keep track if an element changes
    define_method "#{attr_name}_with_specific=" do |obj|
      old_attrs = send(attr_name.to_sym)
      old_attrs = old_attrs.clone if old_attrs
      send "#{attr_name}_without_specific=".to_sym, obj
     
      if old_attrs != send(attr_name.to_sym)
        self.audit_counter = 0 unless audit_counter
        self.audit_counter += 1
      end
    end
    alias_method_chain "#{attr_name}=".to_sym, :specific
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
  
  def csv_field_values
    self.class.csv_fields.map {|field| field.split('.').execute_model self}
  end
  
  def is_favorite_for? user
    Favorite.find :first, :conditions => {:user_id => user.id, :favorable_type => self.class.name, :favorable_id => self.id}
  end
  
  def favorite_user_ids
    favorites.map{|fav| fav.user_id}.flatten.compact
  end

  def filter_amount amount
    if amount.is_a? String
      amount.gsub("\$", "").gsub(",","")
    else
      amount
    end
  end
  
  attr_accessor :workflow_note
  attr_accessor :workflow_ip_address
  def track_workflow_changes
   # If state changed, track a WorkflowEvent
   if changed_attributes['state'] != state
     WorkflowEvent.create :comment => self.workflow_note, :ip_address => self.workflow_ip_address.to_s, :workflowable_type => self.class.to_s, 
        :workflowable_id => self.id, :old_state   => changed_attributes['state'], :new_state   => self.state, :created_by  => self.modified_by, :modified_by => self.modified_by
   end
  end
end